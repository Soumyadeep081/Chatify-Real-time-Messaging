'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { insforge } from '../lib/insforge';
import { X, Trophy, Clock, Users, Crown } from 'lucide-react';

export const GAME_TYPES: Record<string, { name: string, desc: string, icon: string }> = {
  tic_tac_toe: { name: 'Tic Tac Toe', desc: 'Classic 3x3 strategy', icon: '❌⭕' },
  rps: { name: 'Rock Paper Scissors', desc: 'A mind game of deduction', icon: '✊✋✌️' },
  dice_roll: { name: 'High Roller', desc: 'Roll a 100-sided die. Highest wins', icon: '🎲' },
  fast_click: { name: 'Fastest Finger', desc: 'First to click 30 times wins', icon: '⚡' },
  reaction: { name: 'Reaction Speed', desc: 'Click when the light turns green!', icon: '🚦' },
  guess_number: { name: 'Number Guesser', desc: 'Guess the hidden number (1-100)', icon: '🔢' },
  math_race: { name: 'Math Race', desc: 'Solve math facts faster than others', icon: '🧮' },
  coin_toss: { name: 'Coin Toss', desc: '50/50 Chance to win it all', icon: '🪙' },
  word_scramble: { name: 'Word Scramble', desc: 'Unscramble the word first', icon: '🔠' },
  trivia: { name: 'Quick Trivia', desc: 'First to pick the right answer wins', icon: '🧠' }
};

interface GameOverlayProps {
  gameType: string;
  roomId: string;
  currentUser: any;
  targetType: 'user' | 'group' | null;
  targetData: any;
  isInviter: boolean;
  onClose: () => void;
}

// ── helper: stable delay ──────────────────────────────────────────────
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export default function GameOverlay({
  gameType, roomId, currentUser, targetType, targetData, isInviter, onClose
}: GameOverlayProps) {

  // ── state ──────────────────────────────────────────────────────────
  const [players, setPlayers]     = useState<Record<string, any>>({});
  const [gameState, setGameState] = useState<any>({ status: 'waiting', logs: [] });
  const [hasWon, setHasWon]       = useState(false);
  const [localInput, setLocalInput] = useState('');
  const [reactionTimer, setReactionTimer] = useState<any>(null);
  const [phase, setPhase]         = useState<'connecting' | 'lobby' | 'playing'>('connecting');
  const [error, setError]         = useState<string | null>(null);

  // ── stable refs (avoid stale closures in callbacks) ────────────────
  const mountedRef      = useRef(true);
  const playersRef      = useRef<Record<string, any>>({});
  const gameStateRef    = useRef<any>({ status: 'waiting', logs: [] });
  const channelRef      = useRef(`game_room:${roomId}`);
  const acknowledgedRef = useRef<Set<string>>(new Set()); // players we've replied to already

  // ── game constants ─────────────────────────────────────────────────
  const MATH_QUESTIONS = [
    { q: '12 + 15 = ?', a: '27' }, { q: '8 × 7 = ?', a: '56' },
    { q: '144 / 12 = ?', a: '12' }, { q: '30 - 18 = ?', a: '12' },
    { q: '9 × 9 = ?', a: '81' },   { q: '64 / 8 = ?', a: '8' }
  ];
  const SCRAMBLED = [
    { q: 'nitoacre', a: 'reaction' }, { q: 'rowlked', a: 'workload' },
    { q: 'tac', a: 'cat' }, { q: 'enigs', a: 'reigns' }, { q: 'lbeta', a: 'table' }
  ];
  const TRIVIA = [
    { q: 'Capital of France?',  opts: ['Lyon', 'Paris', 'Marseille'],       a: 'Paris'   },
    { q: 'What is 2+2?',        opts: ['3', '4', '5'],                       a: '4'       },
    { q: 'Largest planet?',     opts: ['Saturn', 'Jupiter', 'Neptune'],      a: 'Jupiter' },
    { q: 'H₂O is?',            opts: ['Hydrogen gas', 'Water', 'Helium'],   a: 'Water'   }
  ];

  // ── derived player info ────────────────────────────────────────────
  const myName: string = (
    currentUser.profile?.name ||
    currentUser.name ||
    currentUser.profile?.username ||
    currentUser.username ||
    'Player'
  ).toString();

  // ══════════════════════════════════════════════════════════════════
  // ── PRESENCE: update this player in DB and read room members ──────
  // ══════════════════════════════════════════════════════════════════

  const upsertSelfInDB = useCallback(async () => {
    try {
      await insforge.database.rpc('upsert_game_player', {
        p_room_id: roomId,
        p_user_id: currentUser.id,
        p_player_name: myName,
        p_is_host: isInviter
      });
    } catch (e) {
      // non-fatal
    }
  }, [roomId, currentUser.id, myName, isInviter]);

  const refreshPlayersFromDB = useCallback(async () => {
    if (!mountedRef.current) return;
    // Once game is playing, don't refresh players from DB — the player list is frozen
    // and we don't want stale last_seen evictions to remove players mid-game.
    if (gameStateRef.current.status === 'playing' || gameStateRef.current.status === 'finished') return;
    try {
      // In lobby: 15s cutoff. Before that, use a very generous window.
      const cutoff = new Date(Date.now() - 15_000).toISOString();
      const { data } = await insforge.database
        .from('game_session_players')
        .select('*')
        .eq('room_id', roomId)
        .gte('last_seen', cutoff);

      if (!mountedRef.current || !data) return;

      const next: Record<string, any> = {};
      data.forEach((row: any) => {
        next[row.user_id] = {
          id: row.user_id,
          name: row.player_name,
          isInviter: row.is_host,
          lastSeen: new Date(row.last_seen).getTime()
        };
      });

      playersRef.current = next;
      setPlayers(next);
    } catch (e) {
      // non-fatal
    }
  }, [roomId]);

  // Polls the DB for game state — fallback for missed state_update pub/sub events
  // BOTH players poll: host can't receive guest moves if pub/sub fails (and vice versa)
  const pollGameStateFromDB = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const { data } = await insforge.database
        .from('game_sessions')
        .select('status, game_state_json, last_writer_id')
        .eq('id', roomId)
        .maybeSingle();

      if (!mountedRef.current || !data || !data.game_state_json) return;

      // CRITICAL: only apply if the OTHER player wrote this state.
      // If we wrote it ourselves, we already have it in gameStateRef — skip.
      if (data.last_writer_id === currentUser.id) return;

      const dbStatus    = data.status;
      const localStatus = gameStateRef.current.status;

      // Apply only if DB is "ahead" (never regress to waiting)
      const shouldApply =
        (localStatus === 'waiting' && (dbStatus === 'playing' || dbStatus === 'finished')) ||
        (localStatus === 'playing') ||
        (localStatus === 'finished' && dbStatus === 'finished');

      if (!shouldApply) return;

      try {
        const dbState = JSON.parse(data.game_state_json);
        if (!dbState || dbState.status === 'waiting') return; // never regress
        gameStateRef.current = dbState;
        setGameState(dbState);
        if (dbState.status === 'finished' && dbState.winnerId === currentUser.id) {
          handleWin(dbState.winnerId);
        }
      } catch (_) { /* invalid JSON — ignore */ }
    } catch (e) {
      // non-fatal
    }
  }, [roomId, currentUser.id]);


  // ══════════════════════════════════════════════════════════════════
  // ── MAIN INIT EFFECT ──────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════
  useEffect(() => {
    mountedRef.current = true;
    const channel = channelRef.current;
    let heartbeatInterval: ReturnType<typeof setInterval>;
    let dbRefreshInterval: ReturnType<typeof setInterval>;
    let cleanupHandlers: (() => void) | null = null;

    const init = async () => {
      try {
        // 1. Ensure realtime is connected
        await insforge.realtime.connect();
        await delay(300);

        // 2. If host: create the game session record first
        if (isInviter) {
          try {
            await insforge.database.rpc('upsert_game_session', {
              p_room_id: roomId,
              p_game_type: gameType,
              p_host_id: currentUser.id
            });
          } catch (_) { /* non-fatal */ }
        }

        // 3. Register self in DB (source of truth)
        await upsertSelfInDB();

        // 4. Subscribe to channel
        await insforge.realtime.subscribe(channel);
        await delay(200);

        if (!mountedRef.current) return;

        // ── Event handlers ────────────────────────────────────────────

        // lobby_sync: lightweight pub/sub for fast lobby updates
        const onLobbySync = async (payload: any) => {
          if (!mountedRef.current) return;
          if (payload?.room !== roomId) return;

          switch (payload.type) {
            case 'announce': {
              // Another player announced themselves → update our local players map
              const p = { id: payload.id, name: payload.name, isInviter: payload.isInviter, lastSeen: Date.now() };
              playersRef.current = { ...playersRef.current, [payload.id]: p };
              setPlayers({ ...playersRef.current });
              
              // Only reply ONCE when we first hear from this peer (prevent echo loop)
              if (payload.id !== currentUser.id && !acknowledgedRef.current.has(payload.id)) {
                acknowledgedRef.current.add(payload.id);
                await insforge.realtime.publish(channel, 'lobby_sync', {
                  type: 'announce',
                  room: roomId,
                  id: currentUser.id,
                  name: myName,
                  isInviter
                });
              }
              break;
            }
            case 'room_state': {
              // Full state broadcast from host
              if (!payload.players) return;
              const next = { ...playersRef.current };
              Object.entries(payload.players).forEach(([id, p]: [string, any]) => {
                next[id] = { ...p, lastSeen: Date.now() };
              });
              playersRef.current = next;
              setPlayers({ ...next });

              // Also sync game state if we're still waiting
              if (payload.gameState &&
                  (gameStateRef.current.status === 'waiting' || !gameStateRef.current.status)) {
                gameStateRef.current = payload.gameState;
                setGameState(payload.gameState);
              }
              break;
            }
          }
        };

        // state_update: syncs game state changes (moves, turns, etc.)
        const onStateUpdate = (payload: any) => {
          if (!mountedRef.current) return;
          if (payload?.room !== roomId) return;
          gameStateRef.current = payload;
          setGameState(payload);
          if (payload.status === 'finished' && payload.winnerId === currentUser.id) {
            handleWin(payload.winnerId);
          }
        };

        // fast_click uses event-sourcing to avoid race conditions
        const onGameAction = (payload: any) => {
          if (!mountedRef.current) return;
          if (payload?.room !== roomId) return;
          if (payload.type === 'click' && gameType === 'fast_click') {
            let winnerId: string | null = null;
            setGameState((prev: any) => {
              if (!prev.logic?.clicks || prev.status !== 'playing') return prev;
              const current = (prev.logic.clicks[payload.userId] || 0) + 1;
              const clicks = { ...prev.logic.clicks, [payload.userId]: current };
              if (isInviter && current >= 30) winnerId = payload.userId;
              return { ...prev, logic: { ...prev.logic, clicks } };
            });
            if (winnerId) {
              declareWinner(winnerId, `⚡ ${payload.userName} reached 30 clicks first!`);
            }
          }
        };

        insforge.realtime.on('lobby_sync',   onLobbySync);
        insforge.realtime.on('state_update', onStateUpdate);
        insforge.realtime.on('game_action',  onGameAction);

        cleanupHandlers = () => {
          insforge.realtime.off('lobby_sync',   onLobbySync);
          insforge.realtime.off('state_update', onStateUpdate);
          insforge.realtime.off('game_action',  onGameAction);
        };

        // 5. Initial announce: tell everyone we're here
        const announce = async () => {
          if (!mountedRef.current) return;
          await insforge.realtime.publish(channel, 'lobby_sync', {
            type: 'announce',
            room: roomId,
            id: currentUser.id,
            name: myName,
            isInviter
          });
        };

        // 6. Add self to local players immediately
        const selfEntry = { id: currentUser.id, name: myName, isInviter, lastSeen: Date.now() };
        playersRef.current = { [currentUser.id]: selfEntry };
        setPlayers({ [currentUser.id]: selfEntry });

        // 7. Pull current room members from DB (catches players who joined before us)
        await refreshPlayersFromDB();

        // 8. Announce ourselves on the realtime channel
        await announce();

        // 9. Host also broadcasts current room state to help latecomers
        if (isInviter) {
          await insforge.realtime.publish(channel, 'lobby_sync', {
            type: 'room_state',
            room: roomId,
            players: playersRef.current,
            gameState: gameStateRef.current
          });
        }

        // Show lobby
        if (mountedRef.current) setPhase('lobby');

        // 10. Heartbeat: keep DB presence fresh ALWAYS, pub/sub announce only in lobby
        heartbeatInterval = setInterval(async () => {
          if (!mountedRef.current) return;
          try {
            // ALWAYS update last_seen in DB so we never get evicted (even mid-game)
            await upsertSelfInDB();

            // Pub/sub lobby actions only while waiting
            if (gameStateRef.current.status === 'waiting') {
              await announce();
              // Host re-broadcasts full room state to catch latecomers
              if (isInviter) {
                await insforge.realtime.publish(channel, 'lobby_sync', {
                  type: 'room_state',
                  room: roomId,
                  players: playersRef.current,
                  gameState: gameStateRef.current
                });
              }
            }
          } catch (e) {
            // non-fatal
          }
        }, 2000);

        // 11. DB polling: player list refresh (lobby only) + game state fallback (every 2s)
        dbRefreshInterval = setInterval(async () => {
          if (!mountedRef.current) return;
          await refreshPlayersFromDB();   // no-op when game is playing
          await pollGameStateFromDB();    // catches missed state_update pub/sub events
        }, 2000);

      } catch (err: any) {
        console.error('[GameRoom] Init failed:', err);
        if (mountedRef.current) setError('Connection failed. Please close and try again.');
        setPhase('lobby');
      }
    };

    init();

    return () => {
      mountedRef.current = false;
      clearInterval(heartbeatInterval);
      clearInterval(dbRefreshInterval);
      if (reactionTimer) clearTimeout(reactionTimer);
      if (cleanupHandlers) cleanupHandlers();
      insforge.realtime.unsubscribe(channel);

      // Remove self from DB when leaving (fire-and-forget, component is unmounting)
      void (async () => {
        try {
          await insforge.database
            .from('game_session_players')
            .delete()
            .eq('room_id', roomId)
            .eq('user_id', currentUser.id);
        } catch (_) { /* non-fatal */ }
      })();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, currentUser.id]);

  // ══════════════════════════════════════════════════════════════════
  // ── GAME ACTIONS ──────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════

  const handleWin = async (winnerId: string) => {
    if (hasWon) return;
    setHasWon(true);
    if (targetType === 'group' && targetData?.id) {
      try {
        await insforge.database.rpc('increment_game_win', {
          p_group_id: targetData.id,
          p_user_id: winnerId
        });
      } catch (err) {
        console.error('Win update failed:', err);
      }
    }
  };

  const syncState = async (newState: any) => {
    if (!mountedRef.current) return;
    const state = { ...newState, room: roomId };
    gameStateRef.current = state;
    setGameState(state);

    // Broadcast via pub/sub (fast path — best case delivery)
    await insforge.realtime.publish(channelRef.current, 'state_update', state);

    // ALSO persist full state to DB with writer ID (fallback for missed pub/sub events)
    // The opponent polls this every 2s and applies it ONLY if we are the writer (not themselves)
    void (async () => {
      try {
        await insforge.database.rpc('sync_game_state', {
          p_room_id: roomId,
          p_status: state.status || 'playing',
          p_game_state_json: JSON.stringify(state),
          p_writer_id: currentUser.id     // ← lets the other player skip their own writes
        });
      } catch (_) { /* non-fatal */ }
    })();
  };

  const startGame = () => {
    // Determine p1/p2 from known players
    const allIds = Object.keys(playersRef.current);
    const p1 = allIds.find(id => playersRef.current[id]?.isInviter) || allIds[0];
    const p2 = allIds.find(id => !playersRef.current[id]?.isInviter) ||
               (allIds.length > 1 ? allIds.find(id => id !== p1)! : allIds[0]);

    let logic: any = {};
    if (gameType === 'tic_tac_toe')  logic = { board: Array(9).fill(null), turn: p1, p1, p2 };
    if (gameType === 'dice_roll')    logic = { rolls: {}, turnOrder: [p1, p2], currentTurnIdx: 0 };
    if (gameType === 'fast_click')   logic = { clicks: { [p1]: 0, [p2]: 0 } };
    if (gameType === 'math_race')    logic = { qIndex: Math.floor(Math.random() * MATH_QUESTIONS.length) };
    if (gameType === 'word_scramble')logic = { wIndex: Math.floor(Math.random() * SCRAMBLED.length) };
    if (gameType === 'trivia')       logic = { tIndex: Math.floor(Math.random() * TRIVIA.length) };
    if (gameType === 'guess_number') logic = { target: Math.floor(Math.random() * 100) + 1, turn: p1, p1, p2 };
    if (gameType === 'coin_toss')    logic = { phase: 'choose', turn: p1, p1, p2 };
    if (gameType === 'rps')          logic = { moves: {}, p1, p2 };
    if (gameType === 'reaction') {
      logic = { phase: 'waiting', color: 'bg-red-500', firstTurn: p1 };
      const timer = setTimeout(() => {
        syncState({ status: 'playing', logic: { phase: 'go', color: 'bg-green-400', start: Date.now(), firstTurn: p1 }, logs: ['🟢 GO!'], room: roomId });
      }, 2000 + Math.random() * 3000);
      setReactionTimer(timer);
    }

    syncState({ status: 'playing', logic, logs: ['🎮 Game started! Host goes first.'], room: roomId });
  };

  const declareWinner = (winnerId: string, reason: string) => {
    syncState({
      ...gameStateRef.current,
      status: 'finished',
      winnerId,
      logs: [...(gameStateRef.current.logs || []), reason]
    });
  };

  // ── Game-specific handlers ─────────────────────────────────────────

  const handleTTTClick = (index: number) => {
    const gs = gameStateRef.current;
    if (gs.status !== 'playing' || gs.logic.turn !== currentUser.id || gs.logic.board[index]) return;
    const board = [...gs.logic.board];
    board[index] = gs.logic.turn === gs.logic.p1 ? 'X' : 'O';
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    let won = false;
    for (const [a,b,c] of lines) { if (board[a] && board[a]===board[b] && board[a]===board[c]) { won=true; break; } }
    if (won) declareWinner(currentUser.id, `🏆 ${playersRef.current[currentUser.id]?.name || 'Player'} wins!`);
    else if (!board.includes(null)) declareWinner('draw', "🤝 It's a draw!");
    else {
      const nextTurn = gs.logic.turn === gs.logic.p1 ? gs.logic.p2 : gs.logic.p1;
      syncState({ ...gs, logic: { ...gs.logic, board, turn: nextTurn } });
    }
  };

  const handleFastClick = async () => {
    if (gameStateRef.current.status !== 'playing') return;
    await insforge.realtime.publish(channelRef.current, 'game_action', {
      room: roomId, type: 'click',
      userId: currentUser.id,
      userName: myName
    });
  };

  const handleDiceRoll = () => {
    const gs = gameStateRef.current;
    if (gs.status !== 'playing') return;
    const { turnOrder, currentTurnIdx, rolls } = gs.logic;
    if (turnOrder[currentTurnIdx] !== currentUser.id || rolls[currentUser.id]) return;
    const roll = Math.floor(Math.random() * 100) + 1;
    const newRolls = { ...rolls, [currentUser.id]: roll };
    const nextIdx = (currentTurnIdx + 1) % turnOrder.length;
    const allRolled = Object.keys(newRolls).length >= turnOrder.length;
    if (allRolled) {
      let maxScore = -1; let winner = '';
      Object.entries(newRolls).forEach(([uid, score]: any) => { if (score > maxScore) { maxScore = score; winner = uid; } });
      syncState({ ...gs, status: 'finished', winnerId: winner, logic: { ...gs.logic, rolls: newRolls }, logs: [...(gs.logs||[]), `🎲 ${playersRef.current[winner]?.name || 'Player'} rolled ${maxScore} and wins!`] });
    } else {
      syncState({ ...gs, logic: { ...gs.logic, rolls: newRolls, currentTurnIdx: nextIdx }, logs: [...(gs.logs||[]), `🎲 ${playersRef.current[currentUser.id]?.name} rolled ${roll}. Next player's turn!`] });
    }
  };

  const handleCoinToss = (choice: 'heads' | 'tails') => {
    const gs = gameStateRef.current;
    if (gs.status !== 'playing' || gs.logic.phase !== 'choose' || gs.logic.turn !== currentUser.id) return;
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const won = result === choice;
    const loser = gs.logic.p2 === currentUser.id ? gs.logic.p1 : gs.logic.p2;
    declareWinner(won ? currentUser.id : loser, `🪙 Coin landed on ${result}! ${playersRef.current[won ? currentUser.id : loser]?.name || 'Player'} wins!`);
  };

  const handleRPS = (move: 'rock' | 'paper' | 'scissors') => {
    const gs = gameStateRef.current;
    if (gs.status !== 'playing' || gs.logic.moves[currentUser.id]) return;
    const newMoves = { ...gs.logic.moves, [currentUser.id]: move };
    if (Object.keys(newMoves).length >= 2) {
      const [[uid1, m1], [uid2, m2]] = Object.entries(newMoves) as [string, string][];
      const beats: Record<string,string> = { rock: 'scissors', scissors: 'paper', paper: 'rock' };
      let winner: string, reason: string;
      if (m1 === m2) { winner = 'draw'; reason = `🤝 Both chose ${m1}! It's a draw!`; }
      else if (beats[m1] === m2) { winner = uid1; reason = `🏆 ${playersRef.current[uid1]?.name} wins! ${m1} beats ${m2}!`; }
      else { winner = uid2; reason = `🏆 ${playersRef.current[uid2]?.name} wins! ${m2} beats ${m1}!`; }
      declareWinner(winner, reason);
    } else {
      syncState({ ...gs, logic: { ...gs.logic, moves: newMoves }, logs: [...(gs.logs||[]), `✋ Waiting for opponent...`] });
    }
  };

  const handleInputSubmit = (e: any) => {
    e.preventDefault();
    const gs = gameStateRef.current;
    if (gs.status !== 'playing') return;
    const val = localInput.trim().toLowerCase();
    setLocalInput('');
    if (gameType === 'math_race') {
      if (val === MATH_QUESTIONS[gs.logic.qIndex].a) declareWinner(currentUser.id, `🏆 ${playersRef.current[currentUser.id]?.name} solved it first!`);
      else syncState({ ...gs, logs: [...(gs.logs||[]), `❌ That's wrong, try again!`] });
    } else if (gameType === 'word_scramble') {
      if (val === SCRAMBLED[gs.logic.wIndex].a) declareWinner(currentUser.id, `🏆 ${playersRef.current[currentUser.id]?.name} unscrambled it first!`);
      else syncState({ ...gs, logs: [...(gs.logs||[]), `❌ Nope! Try again.`] });
    } else if (gameType === 'guess_number') {
      const { turn, p1, p2 } = gs.logic;
      if (turn !== currentUser.id) return;
      const num = parseInt(val);
      if (isNaN(num)) return;
      if (num === gs.logic.target) declareWinner(currentUser.id, `🏆 ${playersRef.current[currentUser.id]?.name} guessed ${num}!`);
      else {
        const hint = num < gs.logic.target ? '📈 Too low!' : '📉 Too high!';
        syncState({ ...gs, logic: { ...gs.logic, turn: turn === p1 ? p2 : p1 }, logs: [...(gs.logs||[]), hint] });
      }
    }
  };

  // ══════════════════════════════════════════════════════════════════
  // ── RENDER ────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════

  const playerCount = Object.keys(players).length;
  const canStart    = playerCount >= 2;

  const renderWaiting = () => (
    <div className="flex flex-col items-center justify-center p-12 text-center text-white/50">
      <div className="text-6xl mb-6 animate-bounce">{GAME_TYPES[gameType]?.icon}</div>
      <h3 className="text-2xl font-black text-white tracking-tight mb-2">Waiting for players...</h3>
      <p className="mb-2 text-sm text-white/30">
        Room: <span className="font-mono text-[10px] select-all">{roomId}</span>
      </p>
      <p className="mb-6 text-sm">
        Players in lobby: <span className="text-[#eaff96] font-bold text-lg">{playerCount}</span>
        <span className="text-white/30"> / 2</span>
      </p>

      {/* Player chips */}
      <div className="flex flex-wrap gap-3 justify-center mb-8">
        {Object.values(players).map((p: any) => (
          <div key={p.id} className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full animate-in fade-in duration-300">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white text-sm font-semibold">{p.name}</span>
            {p.isInviter && <Crown size={12} className="text-[#eaff96]" />}
            {p.id === currentUser.id && <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest">(you)</span>}
          </div>
        ))}
        {playerCount < 2 && (
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 border-dashed px-4 py-2 rounded-full">
            <div className="w-2 h-2 rounded-full bg-white/20 animate-pulse" />
            <span className="text-white/20 text-sm">Waiting for opponent...</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-4">
        {isInviter ? (
          <button
            onClick={startGame}
            disabled={!canStart}
            className="bg-[#eaff96] text-black font-black px-8 py-3 rounded-full hover:scale-105 transition-all shadow-lg shadow-[#eaff96]/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {canStart ? '▶ Start Game Now' : 'Waiting for opponent...'}
          </button>
        ) : (
          <div className="flex items-center gap-3 text-[#eaff96] text-sm font-bold bg-[#eaff96]/10 px-6 py-2 rounded-full border border-[#eaff96]/20">
            <Clock size={16} className="animate-spin" />
            <span>Waiting for host to start...</span>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-6 text-red-400 text-xs font-semibold">{error}</p>
      )}
    </div>
  );

  const renderFinished = () => (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <Trophy size={64} className={`mb-6 ${gameState.winnerId === currentUser.id ? 'text-[#eaff96]' : 'text-white/20'}`} />
      <h3 className="text-3xl font-extrabold text-white mb-2">
        {gameState.winnerId === 'draw' ? '🤝 DRAW!' :
          gameState.winnerId === currentUser.id ? '🏆 YOU WON!' :
            `${players[gameState.winnerId]?.name || 'Opponent'} Won!`}
      </h3>
      <p className="text-white/60 mb-8 text-sm">{gameState.logs?.[gameState.logs.length - 1]}</p>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 w-full max-w-xs">
        <div className="text-xs font-black uppercase tracking-widest text-white/30 mb-3">Final Scores</div>
        {Object.values(players).map((p: any) => (
          <div key={p.id} className="flex items-center justify-between py-1.5">
            <span className="text-sm text-white/80">{p.name} {p.isInviter && '👑'}</span>
            {gameState.winnerId === p.id && <span className="text-[#eaff96] text-xs font-black">WINNER</span>}
            {gameState.winnerId === 'draw' && <span className="text-white/30 text-xs">Draw</span>}
          </div>
        ))}
      </div>
      <button onClick={onClose} className="bg-white/10 text-white font-semibold px-8 py-3 rounded-full hover:bg-white/20 transition-colors">
        Return to Chat
      </button>
    </div>
  );

  const renderPlaying = () => {
    const { logic } = gameState;

    switch (gameType) {
      case 'tic_tac_toe': {
        const isMyTurn = logic.turn === currentUser.id;
        const mySymbol = currentUser.id === logic.p1 ? 'X' : 'O';
        return (
          <div className="flex flex-col items-center pb-8">
            <div className={`text-sm font-black uppercase tracking-widest mb-6 px-4 py-2 rounded-full ${isMyTurn ? 'bg-[#eaff96] text-black' : 'bg-white/5 text-white/40'}`}>
              {isMyTurn ? `Your Turn (${mySymbol})` : `Opponent's Turn`}
            </div>
            <div className="grid grid-cols-3 gap-3 bg-white/5 p-4 rounded-3xl">
              {logic.board.map((cell: any, i: number) => (
                <button key={i} onClick={() => handleTTTClick(i)} disabled={!isMyTurn || !!cell}
                  className="w-24 h-24 bg-[#141414] rounded-2xl flex items-center justify-center text-5xl font-bold text-white hover:bg-[#1a1a1a] transition-colors shadow-sm disabled:cursor-not-allowed">
                  {cell === 'X' ? <span className="text-[#eaff96]">X</span> : cell === 'O' ? <span className="text-indigo-400">O</span> : ''}
                </button>
              ))}
            </div>
          </div>
        );
      }
      case 'fast_click': {
        const myClicks = logic.clicks?.[currentUser.id] || 0;
        const opponentClicks = Object.entries(logic.clicks || {}).filter(([id]) => id !== currentUser.id).map(([,v]) => v as number)[0] || 0;
        return (
          <div className="flex flex-col items-center gap-6">
            <div className="flex gap-8 mb-2">
              <div className="text-center"><div className="text-5xl font-black text-[#eaff96]">{myClicks}</div><div className="text-xs text-white/30 font-bold uppercase mt-1">You</div></div>
              <div className="text-white/10 text-3xl font-black self-center">vs</div>
              <div className="text-center"><div className="text-5xl font-black text-white/40">{opponentClicks}</div><div className="text-xs text-white/30 font-bold uppercase mt-1">Opponent</div></div>
            </div>
            <button onClick={handleFastClick} className="w-full bg-[#eaff96] py-16 rounded-[3rem] text-black text-3xl font-black uppercase tracking-widest active:scale-95 transition-transform shadow-2xl">
              CLICK! ({30 - myClicks} left)
            </button>
          </div>
        );
      }
      case 'dice_roll': {
        const { turnOrder, currentTurnIdx, rolls } = logic;
        const isMyTurn = turnOrder && turnOrder[currentTurnIdx] === currentUser.id;
        const myRoll = rolls?.[currentUser.id];
        return (
          <div className="flex flex-col items-center gap-6">
            <div className={`text-sm font-black uppercase tracking-widest px-4 py-2 rounded-full ${isMyTurn ? 'bg-[#eaff96] text-black' : 'bg-white/5 text-white/40'}`}>
              {isMyTurn ? '🎲 Your Turn to Roll!' : '⏳ Waiting for opponent...'}
            </div>
            <button onClick={handleDiceRoll} disabled={!!myRoll || !isMyTurn}
              className="w-48 h-48 bg-[#141414] border border-white/10 rounded-3xl flex items-center justify-center text-6xl shadow-xl hover:bg-[#1a1a1a] transition-colors disabled:opacity-50">
              {myRoll ? `${myRoll}` : '🎲'}
            </button>
            <div className="w-full space-y-2">
              {Object.entries(rolls || {}).map(([uid, roll]: any) => (
                <div key={uid} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2">
                  <span className="text-white/60 text-sm">{players[uid]?.name || 'Player'}</span>
                  <span className="text-[#eaff96] font-black">{roll}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'math_race':
      case 'word_scramble': {
        const prompt = gameType === 'math_race' ? MATH_QUESTIONS[logic.qIndex]?.q : SCRAMBLED[logic.wIndex]?.q.toUpperCase();
        return (
          <div className="flex flex-col items-center w-full max-w-sm mx-auto gap-4">
            <div className="bg-[#141414] border border-white/5 w-full p-8 rounded-[2rem] text-center shadow-xl">
              <div className="text-white/40 text-sm font-semibold uppercase tracking-widest mb-4">{gameType === 'math_race' ? 'Solve First!' : 'Unscramble!'}</div>
              <div className="text-4xl font-black text-white tracking-widest">{prompt}</div>
            </div>
            <form onSubmit={handleInputSubmit} className="w-full flex">
              <input autoFocus value={localInput} onChange={e => setLocalInput(e.target.value)} type="text"
                className="flex-1 bg-[#1a1a1a] rounded-l-full px-6 py-4 text-white focus:outline-none border border-white/10 border-r-0" placeholder="Your answer..." />
              <button type="submit" className="bg-[#eaff96] text-black px-8 font-bold rounded-r-full hover:brightness-110">Go</button>
            </form>
            <div className="w-full max-h-24 overflow-y-auto text-white/40 text-sm flex flex-col items-center gap-1">
              {gameState.logs.slice(-3).reverse().map((l: string, i: number) => <div key={i}>{l}</div>)}
            </div>
          </div>
        );
      }
      case 'guess_number': {
        const isMyTurn = logic.turn === currentUser.id;
        return (
          <div className="flex flex-col items-center w-full max-w-sm mx-auto gap-4">
            <div className={`text-sm font-black px-4 py-2 rounded-full ${isMyTurn ? 'bg-[#eaff96] text-black' : 'bg-white/5 text-white/40'}`}>
              {isMyTurn ? 'Your Guess (1-100)' : "Opponent's Turn"}
            </div>
            <div className="bg-[#141414] w-full p-8 rounded-[2rem] text-center border border-white/5">
              <div className="text-6xl font-black text-white/20 mb-2">?</div>
              <div className="text-white/40 text-sm">Guess the hidden number</div>
            </div>
            {isMyTurn && (
              <form onSubmit={handleInputSubmit} className="w-full flex">
                <input autoFocus value={localInput} onChange={e => setLocalInput(e.target.value)} type="number" min="1" max="100"
                  className="flex-1 bg-[#1a1a1a] rounded-l-full px-6 py-4 text-white focus:outline-none border border-white/10 border-r-0" placeholder="Enter 1-100..." />
                <button type="submit" className="bg-[#eaff96] text-black px-8 font-bold rounded-r-full">Guess</button>
              </form>
            )}
            <div className="w-full space-y-1">
              {gameState.logs.slice(-4).reverse().map((l: string, i: number) => (
                <div key={i} className="text-center text-white/40 text-sm">{l}</div>
              ))}
            </div>
          </div>
        );
      }
      case 'reaction': {
        const isGreen = logic.phase === 'go';
        return (
          <div className="flex flex-col items-center justify-center w-full h-full pb-10">
            <button
              onClick={() => {
                if (isGreen) declareWinner(currentUser.id, `⚡ ${playersRef.current[currentUser.id]?.name} reacted in ${Date.now() - logic.start}ms!`);
                else syncState({ ...gameStateRef.current, logs: [...(gameStateRef.current.logs||[]), `❌ ${playersRef.current[currentUser.id]?.name || 'Player'} clicked too early!`] });
              }}
              className={`w-full max-w-md aspect-square rounded-[3rem] transition-colors duration-300 shadow-2xl active:scale-95 flex items-center justify-center ${isGreen ? 'bg-green-400 shadow-green-400/30' : 'bg-red-500/80'}`}>
              <span className="text-white text-3xl font-black uppercase tracking-widest">{isGreen ? 'CLICK NOW!' : 'WAIT...'}</span>
            </button>
          </div>
        );
      }
      case 'trivia': {
        const tQ = TRIVIA[logic.tIndex];
        return (
          <div className="flex flex-col items-center w-full gap-4">
            <div className="text-2xl font-bold text-white text-center mb-4 bg-[#141414] p-6 rounded-2xl border border-white/5 w-full">{tQ.q}</div>
            <div className="w-full space-y-3">
              {tQ.opts.map((opt: string) => (
                <button key={opt}
                  onClick={() => {
                    if (opt === tQ.a) declareWinner(currentUser.id, `🏆 ${playersRef.current[currentUser.id]?.name} got it right!`);
                    else syncState({ ...gameStateRef.current, logs: [...(gameStateRef.current.logs||[]), `❌ Wrong! Try again.`] });
                  }}
                  className="w-full bg-[#141414] border border-white/5 py-4 rounded-2xl hover:bg-[#1a1a1a] hover:border-[#eaff96]/50 text-white font-semibold transition-all">
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );
      }
      case 'coin_toss': {
        const isMyTurn = logic.turn === currentUser.id;
        return (
          <div className="flex flex-col items-center gap-6">
            {isMyTurn ? (
              <>
                <div className="text-2xl font-black text-white">Choose your side!</div>
                <div className="text-6xl animate-bounce">🪙</div>
                <div className="flex gap-4">
                  <button onClick={() => handleCoinToss('heads')} className="px-10 py-5 bg-[#eaff96] text-black font-black rounded-2xl hover:scale-105 transition-transform">HEADS</button>
                  <button onClick={() => handleCoinToss('tails')} className="px-10 py-5 bg-white/10 text-white font-black rounded-2xl hover:bg-white/20 transition-colors">TAILS</button>
                </div>
              </>
            ) : (
              <div className="text-white/40 text-center text-lg">
                <div className="text-6xl mb-4 animate-bounce">🪙</div>
                Waiting for {players[logic.p1]?.name || 'Host'} to choose...
              </div>
            )}
          </div>
        );
      }
      case 'rps': {
        const myMove = logic.moves?.[currentUser.id];
        return (
          <div className="flex flex-col items-center gap-6">
            {!myMove ? (
              <>
                <div className="text-xl font-black text-white">Pick your move!</div>
                <div className="flex gap-4">
                  {(['rock', 'paper', 'scissors'] as const).map(m => (
                    <button key={m} onClick={() => handleRPS(m)}
                      className="flex flex-col items-center gap-2 px-6 py-5 bg-[#141414] border border-white/10 rounded-2xl hover:border-[#eaff96]/50 hover:bg-[#1a1a1a] transition-all">
                      <span className="text-4xl">{m === 'rock' ? '✊' : m === 'paper' ? '✋' : '✌️'}</span>
                      <span className="text-xs font-black text-white/60 uppercase tracking-widest">{m}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-4">{myMove === 'rock' ? '✊' : myMove === 'paper' ? '✋' : '✌️'}</div>
                <div className="text-white/60 text-sm">You chose <span className="text-white font-bold capitalize">{myMove}</span>. Waiting for opponent...</div>
              </div>
            )}
            {Object.keys(logic.moves || {}).length > 0 && (
              <div className="w-full text-center text-white/30 text-xs">{Object.keys(logic.moves).length} / 2 players have chosen</div>
            )}
          </div>
        );
      }
      default:
        return <div className="text-white/40 text-center p-10">Game coming soon...</div>;
    }
  };

  // ── Shell ──────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 shrink-0 bg-[#0a0a0a]/60">
        <div className="flex items-center space-x-3 text-white">
          <span className="text-2xl">{GAME_TYPES[gameType]?.icon}</span>
          <div>
            <div className="font-bold text-lg leading-tight">{GAME_TYPES[gameType]?.name}</div>
            <div className="text-[11px] text-white/40 uppercase tracking-widest flex items-center gap-1">
              <Users size={10} /> Live Multiplayer
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Player badges */}
          <div className="hidden md:flex gap-2">
            {Object.values(players).map((p: any) => (
              <div key={p.id} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${p.id === currentUser.id ? 'bg-[#eaff96]/20 text-[#eaff96] border border-[#eaff96]/30' : 'bg-white/5 text-white/50 border border-white/10'}`}>
                {p.isInviter && <Crown size={10} />}{p.name}
              </div>
            ))}
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_center,#1a1a1a,#0a0a0a)]">
        <div className="w-full max-w-2xl relative z-10">
          {phase === 'connecting' ? (
            <div className="flex flex-col items-center justify-center text-white/20 animate-pulse">
              <Clock size={48} className="mb-4" />
              <div className="text-xs font-black uppercase tracking-[0.3em]">Connecting to Room...</div>
            </div>
          ) : (
            <>
              {gameState.status === 'waiting'  && renderWaiting()}
              {gameState.status === 'finished' && renderFinished()}
              {gameState.status === 'playing'  && renderPlaying()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
