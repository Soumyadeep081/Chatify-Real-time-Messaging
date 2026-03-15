import { NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';

export async function POST(req: Request) {
  try {
    const { userId, contentId, actionType, watchTime, category } = await req.json();

    if (!userId || !actionType) {
      return NextResponse.json({ error: 'Missing userId or actionType' }, { status: 400 });
    }

    // Insert activity
    await insforge.database.from('user_trending_activity').insert([{
      user_id: userId,
      content_id: contentId || null,
      action_type: actionType,
      watch_time: watchTime || 0,
      category: category || 'Unknown',
    }]);

    // Update user interests
    const { data: profile } = await insforge.database
      .from('user_interest_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    let scores = profile?.engagement_scores || {};
    let cat = category || 'Unknown';

    let weight = 1;
    if (actionType === 'share') weight = 5;
    if (actionType === 'bookmark') weight = 4;
    if (actionType === 'chatbot') weight = 3;
    if (actionType === 'view') weight = watchTime > 5 ? 2 : 1;

    scores[cat] = (scores[cat] || 0) + weight;

    if (profile) {
      await insforge.database
        .from('user_interest_profiles')
        .update({ engagement_scores: scores, updated_at: new Date() })
        .eq('user_id', userId);
    } else {
      await insforge.database
        .from('user_interest_profiles')
        .insert([{ user_id: userId, engagement_scores: scores }]);
    }

    // Increment absolute popularity score on the content
    if (contentId) {
       const { data: content } = await insforge.database.from('trending_content').select('popularity_score').eq('id', contentId).single();
       if (content) {
         await insforge.database.from('trending_content').update({ popularity_score: content.popularity_score + weight }).eq('id', contentId);
       }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
