'use client';

import { useState, useEffect, useRef } from 'react';
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
  isInviter: boolean; // true = invited (goes first), false = accepter (goes second)
  onClose: () => void;
}

export default function GameOverlay({ gameType, roomId, currentUser, targetType, targetData, isInviter, onClose }: GameOverlayProps) {
  const [players, setPlayers] = useState<Record<string, any>>({});
  const [gameState, setGameState] = useState<any>({ status: 'waiting', logs: [] });
  const [hasWon, setHasWon] = useState(false);
  const [localInput, setLocalInput] = useState('');
  const [reactionTimer, setReactionTimer] = useState<any>(null);
  const mountedRef = useRef(true);
  const gameStateRef = useRef(gameState);
  const playersRef = useRef(players);

  const MATH_QUESTIONS = [
    { q: '12 + 15 = ?', a: '27' }, { q: '8 × 7 = ?', a: '56' },
    { q: '144 / 12 = ?', a: '12' }, { q: '30 - 18 = ?', a: '12' },
    { q: '9 × 9 = ?', a: '81' }, { q: '64 / 8 = ?', a: '8' }
  ];
  const SCRAMBLED = [
    { q: 'nitoacre', a: 'reaction' }, { q: 'rowlked', a: 'workload' },
    { q: 'tac', a: 'cat' }, { q: 'enigs', a: 'reigns' }, { q: 'lbeta', a: 'table' }
  ];
  const TRIVIA = [
    { q: 'Capital of France?', opts: ['Lyon', 'Paris', 'Marseille'], a: 'Paris' },
    { q: 'What is 2+2?', opts: ['3', '4', '5'], a: '4' },
    { q: 'Largest planet?', opts: ['Saturn', 'Jupiter', 'Neptune'], a: 'Jupiter' },
    { q: 'H₂O is?', opts: ['Hydrogen gas', 'Water', 'Helium'], a: 'Water' }
  ];

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const channel = `game_room:${roomId}`;

    const initGame = async () => {
      try {
        await insforge.realtime.connect();
        
        // Wait up to 2 seconds for a stable connection
        let retries = 0;
        while (!(insforge.realtime as any).isConnected?.() && retries < 10) {
          await new Promise(r => setTimeout(r, 200));
          retries++;
        }

        const res = await insforge.realtime.subscribe(channel);
        if (!res.ok) {
          console.warn(`[GameRoom] Subscription note for ${channel}:`, res.error || 'Transient issue or rejoin');
        }

        const myName: string = (currentUser.profile?.name || currentUser.name || currentUser.profile?.username || currentUser.username || 'Player').toString();

      const updatePlayers = (updater: (prev: Record<string, any>) => Record<string, any>) => {
        setPlayers(prev => {
          const next = updater(prev);
          playersRef.current = next;
          return next;
        });
      };

      // Store handlers to remove them later
      const handlers: Record<string, (payload: any) => void> = {};

      handlers.player_joined = (payload: any) => {
        if (!mountedRef.current) return;
        if (payload.room !== roomId) return;

        updatePlayers(prev => {
          const next = { ...prev, [payload.id]: payload };
          
          // Reply with my info and current state so the new player is up to date
          insforge.realtime.publish(channel, 'player_ack', {
            room: roomId,
            id: currentUser.id,
            name: myName,
            isInviter,
            gameState: gameStateRef.current // Send state along with ack
          });
          
          return next;
        });
      };

      handlers.player_ack = (payload: any) => {
        if (!mountedRef.current) return;
        if (payload.room !== roomId) return;

        updatePlayers(prev => ({ ...prev, [payload.id]: payload }));

        // If the sender provided a game state and mine is empty/initial, adopt it
        if (payload.gameState && (gameStateRef.current.status === 'waiting' || !gameStateRef.current.status)) {
          setGameState(payload.gameState);
          gameStateRef.current = payload.gameState;
        }
      };

      handlers.room_sync = (payload: any) => {
        if (!mountedRef.current) return;
        if (payload.room !== roomId) return;
        
        if (payload.players) updatePlayers(() => payload.players);
        if (payload.gameState) {
          setGameState(payload.gameState);
          gameStateRef.current = payload.gameState;
        }
      };

      handlers.state_update = (payload: any) => {
        if (!mountedRef.current) return;
        if (payload.room !== roomId) return;

        setGameState(payload);
        gameStateRef.current = payload;
        if (payload.status === 'finished' && payload.winnerId === currentUser.id) {
          handleWin(payload.winnerId);
        }
      };

      handlers.game_action = (payload: any) => {
        if (!mountedRef.current) return;
        if (payload.room !== roomId) return;

        if (payload.type === 'click' && gameType === 'fast_click') {
          let winnerDetected = false;
          setGameState((prev: any) => {
            if (!prev.logic || !prev.logic.clicks) return prev;
            const currentClicks = (prev.logic.clicks[payload.userId] || 0) + 1;
            const newClicks = { ...prev.logic.clicks, [payload.userId]: currentClicks };
            const newState = { ...prev, logic: { ...prev.logic, clicks: newClicks } };
            
            if (isInviter && currentClicks >= 30 && prev.status === 'playing') {
              winnerDetected = true;
            }
            return newState;
          });
          if (winnerDetected) {
            declareWinner(payload.userId, `⚡ ${payload.userName} reached 30 clicks first!`);
          }
        }
      };

      // Assign handlers
      insforge.realtime.on('player_joined', handlers.player_joined);
      insforge.realtime.on('player_ack', handlers.player_ack);
      insforge.realtime.on('room_sync', handlers.room_sync);
      insforge.realtime.on('state_update', handlers.state_update);
      insforge.realtime.on('game_action', handlers.game_action);

      // Announce myself after subscription is ready
      // Small delay to ensure subscription is fully propagated in server
      setTimeout(() => {
        if (!mountedRef.current) return;
        insforge.realtime.publish(channel, 'player_joined', {
          room: roomId,
          id: currentUser.id,
          name: myName,
          isInviter,
        });
      }, 300);

      // Register self immediately
      setPlayers({
        [currentUser.id]: { id: currentUser.id, name: myName, isInviter }
      });

      return () => {
        insforge.realtime.off('player_joined', handlers.player_joined);
        insforge.realtime.off('player_ack', handlers.player_ack);
        insforge.realtime.off('room_sync', handlers.room_sync);
        insforge.realtime.off('state_update', handlers.state_update);
        insforge.realtime.off('game_action', handlers.game_action);
      };
      } catch (err) {
        console.error('[GameRoom] Initialization failed:', err);
        return () => {};
      }
    };

    let stopGame: (() => void) | undefined;
    initGame().then(cleanup => { stopGame = cleanup; });

    return () => {
      if (reactionTimer) clearTimeout(reactionTimer);
      if (stopGame) stopGame();
      insforge.realtime.unsubscribe(channel);
    };
  }, [roomId]);

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

  const syncState = (newState: any) => {
    if (!mountedRef.current) return;
    setGameState(newState);
    gameStateRef.current = newState;
    insforge.realtime.publish(`game_room:${roomId}`, 'state_update', { 
      ...newState, 
      room: roomId 
    });
  };

  // The "inviter" goes first (p1), "accepter" goes second (p2)
  const startGame = () => {
    const allPlayerIds = Object.keys(players);
    const inviterId = allPlayerIds.find(id => players[id]?.isInviter);
    const accepterId = allPlayerIds.find(id => !players[id]?.isInviter);
    const p1 = inviterId || allPlayerIds[0];
    const p2 = accepterId || (allPlayerIds.length > 1 ? allPlayerIds.find(id => id !== p1) : allPlayerIds[0]);

    let initialLogicState: any = {};
    if (gameType === 'tic_tac_toe') initialLogicState = { board: Array(9).fill(null), turn: p1, p1, p2 };
    if (gameType === 'dice_roll') initialLogicState = { rolls: {}, turnOrder: [p1, p2], currentTurnIdx: 0 };
    if (gameType === 'fast_click') initialLogicState = { clicks: {} };
    if (gameType === 'math_race') initialLogicState = { qIndex: Math.floor(Math.random() * MATH_QUESTIONS.length) };
    if (gameType === 'word_scramble') initialLogicState = { wIndex: Math.floor(Math.random() * SCRAMBLED.length) };
    if (gameType === 'trivia') initialLogicState = { tIndex: Math.floor(Math.random() * TRIVIA.length) };
    if (gameType === 'reaction') {
      initialLogicState = { phase: 'waiting', color: 'bg-red-500', firstTurn: p1 };
      const timer = setTimeout(() => {
        syncState({ status: 'playing', logic: { phase: 'go', color: 'bg-green-400', start: Date.now(), firstTurn: p1 }, logs: ['🟢 GO!'] });
      }, 2000 + Math.random() * 3000);
      setReactionTimer(timer);
    }
    if (gameType === 'guess_number') initialLogicState = { target: Math.floor(Math.random() * 100) + 1, turn: p1, p1, p2 };
    if (gameType === 'coin_toss') initialLogicState = { phase: 'choose', turn: p1, p1, p2 };
    if (gameType === 'rps') initialLogicState = { moves: {}, p1, p2 };

    syncState({ status: 'playing', logic: initialLogicState, logs: ['🎮 Game started! Inviter goes first.'] });
  };

  const declareWinner = (winnerId: string, reason: string) => {
    syncState({
      ...gameState,
      status: 'finished',
      winnerId,
      logs: [...(gameState.logs || []), reason]
    });
  };

  // --- Tic Tac Toe ---
  const handleTTTClick = (index: number) => {
    if (gameState.status !== 'playing') return;
    if (gameState.logic.turn !== currentUser.id) return;
    if (gameState.logic.board[index]) return;

    const newBoard = [...gameState.logic.board];
    newBoard[index] = gameState.logic.turn === gameState.logic.p1 ? 'X' : 'O';

    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    let won = false;
    for (const [a, b, c] of lines) {
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) { won = true; break; }
    }

    if (won) {
      declareWinner(currentUser.id, `🏆 ${players[currentUser.id]?.name || 'Player'} wins!`);
    } else if (!newBoard.includes(null)) {
      declareWinner('draw', "🤝 It's a draw!");
    } else {
      const nextTurn = gameState.logic.turn === gameState.logic.p1 ? gameState.logic.p2 : gameState.logic.p1;
      syncState({ ...gameState, logic: { ...gameState.logic, board: newBoard, turn: nextTurn } });
    }
  };

  // --- Fast Click ---
  const handleFastClick = () => {
    if (gameState.status !== 'playing') return;
    // Instead of syncing full state (which causes race conditions in fast clicking),
    // we broadcast a click event. Everyone updates their local count.
    insforge.realtime.publish(`game_room:${roomId}`, 'game_action', {
      type: 'click',
      userId: currentUser.id,
      userName: currentUser.profile?.name || currentUser.name || 'Player'
    });
  };

  // --- Dice Roll (turn-based) ---
  const handleDiceRoll = () => {
    if (gameState.status !== 'playing') return;
    const { turnOrder, currentTurnIdx } = gameState.logic;
    const myTurn = turnOrder && turnOrder[currentTurnIdx] === currentUser.id;
    if (!myTurn) return;
    if (gameState.logic.rolls[currentUser.id]) return;

    const roll = Math.floor(Math.random() * 100) + 1;
    const newRolls = { ...gameState.logic.rolls, [currentUser.id]: roll };
    const nextIdx = (currentTurnIdx + 1) % (turnOrder?.length || 1);
    const allRolled = Object.keys(newRolls).length >= (turnOrder?.length || 1);

    if (allRolled) {
      // Resolve immediately
      let maxScore = -1; let winner = '';
      Object.entries(newRolls).forEach(([uid, score]: any) => {
        if (score > maxScore) { maxScore = score; winner = uid; }
      });
      syncState({ ...gameState, status: 'finished', winnerId: winner, logic: { ...gameState.logic, rolls: newRolls }, logs: [...(gameState.logs || []), `🎲 ${players[winner]?.name || 'Player'} rolled ${maxScore} and wins!`] });
    } else {
      syncState({ ...gameState, logic: { ...gameState.logic, rolls: newRolls, currentTurnIdx: nextIdx }, logs: [...(gameState.logs || []), `🎲 ${players[currentUser.id]?.name} rolled ${roll}. Next player's turn!`] });
    }
  };

  // --- Coin Toss (inviter picks, result auto) ---
  const handleCoinToss = (choice: 'heads' | 'tails') => {
    if (gameState.status !== 'playing') return;
    if (gameState.logic.phase !== 'choose') return;
    if (gameState.logic.turn !== currentUser.id) return;

    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const won = result === choice;
    const winnerId = won ? currentUser.id : (gameState.logic.p2 === currentUser.id ? gameState.logic.p1 : gameState.logic.p2);
    declareWinner(winnerId, `🪙 Coin landed on ${result}! ${players[winnerId]?.name || 'Player'} wins!`);
  };

  // --- RPS ---
  const handleRPS = (move: 'rock' | 'paper' | 'scissors') => {
    if (gameState.status !== 'playing') return;
    if (gameState.logic.moves[currentUser.id]) return;

    const newMoves = { ...gameState.logic.moves, [currentUser.id]: move };
    const playerCount = Object.keys(players).length;
    
    if (Object.keys(newMoves).length >= Math.min(playerCount, 2)) {
      const movesList = Object.entries(newMoves);
      if (movesList.length < 2) {
        syncState({ ...gameState, logic: { ...gameState.logic, moves: newMoves }, logs: [...(gameState.logs || []), `✋ Waiting for opponent...`] });
        return;
      }
      const [uid1, m1] = movesList[0] as [string, string];
      const [uid2, m2] = movesList[1] as [string, string];
      const beats: Record<string, string> = { rock: 'scissors', scissors: 'paper', paper: 'rock' };
      let winner: string;
      let reason: string;
      if (m1 === m2) {
        winner = 'draw';
        reason = `🤝 Both chose ${m1}! It's a draw!`;
      } else if (beats[m1] === m2) {
        winner = uid1;
        reason = `🏆 ${players[uid1]?.name} wins! ${m1} beats ${m2}!`;
      } else {
        winner = uid2;
        reason = `🏆 ${players[uid2]?.name} wins! ${m2} beats ${m1}!`;
      }
      declareWinner(winner, reason);
    } else {
      syncState({ ...gameState, logic: { ...gameState.logic, moves: newMoves }, logs: [...(gameState.logs || []), `✋ Waiting for opponent...`] });
    }
  };

  // --- Input Submit (Math/Word/Guess) ---
  const handleInputSubmit = (e: any) => {
    e.preventDefault();
    if (gameState.status !== 'playing') return;
    const val = localInput.trim().toLowerCase();
    setLocalInput('');

    if (gameType === 'math_race') {
      if (val === MATH_QUESTIONS[gameState.logic.qIndex].a)
        declareWinner(currentUser.id, `🏆 ${players[currentUser.id]?.name} solved it first!`);
      else syncState({ ...gameState, logs: [...(gameState.logs || []), `❌ That's wrong, try again!`] });
    } else if (gameType === 'word_scramble') {
      if (val === SCRAMBLED[gameState.logic.wIndex].a)
        declareWinner(currentUser.id, `🏆 ${players[currentUser.id]?.name} unscrambled it first!`);
      else syncState({ ...gameState, logs: [...(gameState.logs || []), `❌ Nope! Try again.`] });
    } else if (gameType === 'guess_number') {
      const { turn, p1, p2 } = gameState.logic;
      if (turn !== currentUser.id) return;
      const num = parseInt(val);
      if (isNaN(num)) return;
      if (num === gameState.logic.target) {
        declareWinner(currentUser.id, `🏆 ${players[currentUser.id]?.name} guessed ${num}!`);
      } else {
        const hint = num < gameState.logic.target ? '📈 Too low!' : '📉 Too high!';
        const nextTurn = turn === p1 ? p2 : p1;
        syncState({ ...gameState, logic: { ...gameState.logic, turn: nextTurn }, logs: [...(gameState.logs || []), hint] });
      }
    }
  };

  // ──────── RENDER ────────

  const renderWaiting = () => {
    const playerCount = Object.keys(players).length;
    const canStart = playerCount >= 2;
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-white/50">
        <div className="text-6xl mb-6 animate-bounce">{GAME_TYPES[gameType]?.icon}</div>
        <h3 className="text-2xl font-black text-white tracking-tight mb-2">Waiting for players...</h3>
        <p className="mb-6 text-sm">Players joined: <span className="text-[#eaff96] font-bold">{playerCount}</span></p>
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {Object.values(players).map((p: any) => (
            <div key={p.id} className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white text-sm font-semibold">{p.name}</span>
              {p.isInviter && <Crown size={12} className="text-[#eaff96]" />}
            </div>
          ))}
        </div>
        {isInviter && (
          <button
            onClick={startGame}
            disabled={!canStart}
            className="bg-[#eaff96] text-black font-black px-8 py-3 rounded-full hover:scale-105 transition-transform shadow-lg shadow-[#eaff96]/20 disabled:opacity-40"
          >
            {canStart ? 'Start Game Now' : 'Waiting for opponent...'}
          </button>
        )}
        {!isInviter && (
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <Clock size={16} className="animate-spin" />
            <span>Waiting for host to start the game...</span>
          </div>
        )}
      </div>
    );
  };

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
                <button
                  key={i}
                  onClick={() => handleTTTClick(i)}
                  disabled={!isMyTurn || !!cell}
                  className="w-24 h-24 bg-[#141414] rounded-2xl flex items-center justify-center text-5xl font-bold text-white hover:bg-[#1a1a1a] transition-colors shadow-sm disabled:cursor-not-allowed"
                >
                  {cell === 'X' ? <span className="text-[#eaff96]">X</span> : cell === 'O' ? <span className="text-indigo-400">O</span> : ''}
                </button>
              ))}
            </div>
          </div>
        );
      }
      case 'fast_click': {
        const myClicks = logic.clicks[currentUser.id] || 0;
        const opponentClicks = Object.entries(logic.clicks).filter(([id]) => id !== currentUser.id).map(([, v]) => v as number)[0] || 0;
        return (
          <div className="flex flex-col items-center gap-6">
            <div className="flex gap-8 mb-2">
              <div className="text-center">
                <div className="text-5xl font-black text-[#eaff96]">{myClicks}</div>
                <div className="text-xs text-white/30 font-bold uppercase mt-1">You</div>
              </div>
              <div className="text-white/10 text-3xl font-black self-center">vs</div>
              <div className="text-center">
                <div className="text-5xl font-black text-white/40">{opponentClicks}</div>
                <div className="text-xs text-white/30 font-bold uppercase mt-1">Opponent</div>
              </div>
            </div>
            <button
              onClick={handleFastClick}
              className="w-full bg-[#eaff96] py-16 rounded-[3rem] text-black text-3xl font-black uppercase tracking-widest active:scale-95 transition-transform shadow-2xl"
            >
              CLICK! ({30 - myClicks} left)
            </button>
          </div>
        );
      }
      case 'dice_roll': {
        const { turnOrder, currentTurnIdx, rolls } = logic;
        const isMyTurn = turnOrder && turnOrder[currentTurnIdx] === currentUser.id;
        const myRoll = rolls[currentUser.id];
        return (
          <div className="flex flex-col items-center gap-6">
            <div className={`text-sm font-black uppercase tracking-widest px-4 py-2 rounded-full ${isMyTurn ? 'bg-[#eaff96] text-black' : 'bg-white/5 text-white/40'}`}>
              {isMyTurn ? '🎲 Your Turn to Roll!' : "⏳ Waiting for opponent..."}
            </div>
            <button
              onClick={handleDiceRoll}
              disabled={!!myRoll || !isMyTurn}
              className="w-48 h-48 bg-[#141414] border border-white/10 rounded-3xl flex items-center justify-center text-6xl shadow-xl hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 disabled:scale-95"
            >
              {myRoll ? `${myRoll}` : '🎲'}
            </button>
            <div className="w-full space-y-2">
              {Object.entries(rolls).map(([uid, roll]: any) => (
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
        const prompt = gameType === 'math_race'
          ? MATH_QUESTIONS[logic.qIndex]?.q
          : SCRAMBLED[logic.wIndex]?.q.toUpperCase();
        return (
          <div className="flex flex-col items-center w-full max-w-sm mx-auto gap-4">
            <div className="bg-[#141414] border border-white/5 w-full p-8 rounded-[2rem] text-center shadow-xl">
              <div className="text-white/40 text-sm font-semibold uppercase tracking-widest mb-4">
                {gameType === 'math_race' ? 'Solve First!' : 'Unscramble!'}
              </div>
              <div className="text-4xl font-black text-white tracking-widest">{prompt}</div>
            </div>
            <form onSubmit={handleInputSubmit} className="w-full flex">
              <input
                autoFocus value={localInput} onChange={e => setLocalInput(e.target.value)}
                type="text"
                className="flex-1 bg-[#1a1a1a] rounded-l-full px-6 py-4 text-white focus:outline-none border border-white/10 border-r-0"
                placeholder="Your answer..."
              />
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
                <input
                  autoFocus value={localInput} onChange={e => setLocalInput(e.target.value)}
                  type="number" min="1" max="100"
                  className="flex-1 bg-[#1a1a1a] rounded-l-full px-6 py-4 text-white focus:outline-none border border-white/10 border-r-0"
                  placeholder="Enter 1-100..."
                />
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
                if (isGreen) {
                  declareWinner(currentUser.id, `⚡ ${players[currentUser.id]?.name} reacted in ${Date.now() - logic.start}ms!`);
                } else {
                  syncState({ ...gameState, logs: [...(gameState.logs || []), `❌ ${players[currentUser.id]?.name || 'Player'} clicked too early!`] });
                }
              }}
              className={`w-full max-w-md aspect-square rounded-[3rem] transition-colors duration-300 shadow-2xl active:scale-95 flex items-center justify-center ${isGreen ? 'bg-green-400 shadow-green-400/30' : 'bg-red-500/80'}`}
            >
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
                <button
                  key={opt}
                  onClick={() => {
                    if (opt === tQ.a) declareWinner(currentUser.id, `🏆 ${players[currentUser.id]?.name} got it right!`);
                    else syncState({ ...gameState, logs: [...(gameState.logs || []), `❌ Wrong! Try again.`] });
                  }}
                  className="w-full bg-[#141414] border border-white/5 py-4 rounded-2xl hover:bg-[#1a1a1a] hover:border-[#eaff96]/50 text-white font-semibold transition-all"
                >
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
                Waiting for {players[logic.p1]?.name} to choose...
              </div>
            )}
          </div>
        );
      }
      case 'rps': {
        const myMove = logic.moves[currentUser.id];
        return (
          <div className="flex flex-col items-center gap-6">
            {!myMove ? (
              <>
                <div className="text-xl font-black text-white">Pick your move!</div>
                <div className="flex gap-4">
                  {(['rock', 'paper', 'scissors'] as const).map(m => (
                    <button key={m} onClick={() => handleRPS(m)} className="flex flex-col items-center gap-2 px-6 py-5 bg-[#141414] border border-white/10 rounded-2xl hover:border-[#eaff96]/50 hover:bg-[#1a1a1a] transition-all">
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
            {Object.keys(logic.moves).length > 0 && (
              <div className="w-full text-center text-white/30 text-xs">{Object.keys(logic.moves).length} / 2 players have chosen</div>
            )}
          </div>
        );
      }
      default:
        return <div className="text-white/40 text-center p-10">Game coming soon...</div>;
    }
  };

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
          {gameState.status === 'waiting' && renderWaiting()}
          {gameState.status === 'finished' && renderFinished()}
          {gameState.status === 'playing' && renderPlaying()}
        </div>
      </div>
    </div>
  );
}
