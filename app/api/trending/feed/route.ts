import { NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const categoryFilter = searchParams.get('category');

    let query = insforge.database
      .from('trending_content')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (categoryFilter && categoryFilter !== 'All') {
      query = query.eq('category', categoryFilter);
    }

    const { data: contents } = await query;
    if (!contents) return NextResponse.json({ feed: [] });

    let feed = contents as any[];

    // If userId provided, fetch their interest profile and sort
    if (userId) {
      const { data: profile } = await insforge.database
        .from('user_interest_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (profile && profile.engagement_scores) {
        const scores = profile.engagement_scores as Record<string, number>;
        
        feed = feed.map(item => {
           let catMatch = scores[item.category] || 0;
           // formula personalizedScore = 
           // (interestWeight * categoryMatch) + (popularityScore * weight) + recency weight
           const ageMs = Date.now() - new Date(item.created_at).getTime();
           const recencyScore = Math.max(0, 100 - ageMs / (1000 * 60 * 60 * 24)); // Higher if less than 100 days old
           
           item.personalized_score = (catMatch * 10) + (item.popularity_score * 0.5) + (recencyScore * 5);
           return item;
        }).sort((a, b) => (b.personalized_score || 0) - (a.personalized_score || 0));
      } else {
        // Cold start - mostly popularity and recency
        feed = feed.sort((a, b) => b.popularity_score - a.popularity_score);
      }
    } else {
       feed = feed.sort((a, b) => b.popularity_score - a.popularity_score);
    }

    return NextResponse.json({ feed });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
