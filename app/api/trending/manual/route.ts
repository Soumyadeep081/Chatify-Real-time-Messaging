import { NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!data.title || !data.media_url) {
      return NextResponse.json({ error: 'Title and media_url are required' }, { status: 400 });
    }

    const item = {
      title: data.title,
      description: data.description || '',
      category: data.category || 'Others',
      media_url: data.media_url,
      media_type: data.media_type || 'image',
      source_name: data.source_name || 'Admin manual',
      source_url: data.source_url || '',
      tags: data.tags || [],
      popularity_score: data.popularity_score || 100
    };

    const { data: inserted, error } = await insforge.database
      .from('trending_content')
      .insert([item])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, item: inserted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
