import { NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';

const CATEGORIES = [
  'Sports', 'Movies', 'News', 'Geopolitics', 'Web Series',
  'Technology', 'Finance', 'Gaming', 'Entertainment', 'Others'
];

function classifyCategory(title: string, desc: string): string {
  const t = (title + ' ' + desc).toLowerCase();
  if (t.match(/football|basketball|tennis|cricket|sports|athlete/)) return 'Sports';
  if (t.match(/movie|film|cinema|actor|director|box office/)) return 'Movies';
  if (t.match(/politics|election|government|president|war|crisis/)) return 'Geopolitics';
  if (t.match(/netflix|hulu|series|episode|season|show/)) return 'Web Series';
  if (t.match(/tech|ai|apple|google|software|hardware|startup/)) return 'Technology';
  if (t.match(/stock|market|crypto|bitcoin|finance|economy/)) return 'Finance';
  if (t.match(/nintendo|playstation|xbox|game|esports|steam/)) return 'Gaming';
  if (t.match(/celebrity|music|album|song|concert/)) return 'Entertainment';
  if (t.match(/news|update|today|world|local/)) return 'News';
  return 'Others';
}

function cleanDescription(desc: string) {
  if (!desc) return '';
  let cleaned = desc.replace(/<[^>]*>?/gm, ''); // remove html
  cleaned = cleaned.replace(/&[a-z]+;/g, '');
  if (cleaned.length > 200) cleaned = cleaned.substring(0, 197) + '...';
  return cleaned;
}

export async function POST(req: Request) {
  try {
    const newItems = [];

    // Immediately push high-quality vertical video reels
    const reels = [
      {
         title: "Aesthetic Morning Routine",
         description: "Starting the day right with coffee and journaling ✨ #morning #aesthetic #vlog",
         category: "Entertainment",
         media_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
         media_type: "video",
         source_name: "TikTok Creator",
         source_url: "https://tiktok.com",
         tags: ["Vlog", "Aesthetic"],
         popularity_score: 12500
      },
      {
         title: "Breathtaking Mountain Views 🏔️",
         description: "Can't believe this place is real. The hike was worth it! #travel #nature #mountains",
         category: "Others",
         media_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
         media_type: "video",
         source_name: "Travel Gram",
         source_url: "https://instagram.com/travel",
         tags: ["Nature", "Travel"],
         popularity_score: 8400
      },
      {
         title: "Insane Skateboarding Tricks 🛹",
         description: "Landed the hardest trick of my life today! Watch till the end. #skate #sports #extreme",
         category: "Sports",
         media_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
         media_type: "video",
         source_name: "Action Sports",
         source_url: "https://youtube.com/shorts",
         tags: ["Skateboarding", "Extreme"],
         popularity_score: 9200
      },
      {
         title: "Cinematic City Vibes at Night 🌃",
         description: "The city never sleeps. Captured on my new camera. #city #nightlife #cinematic",
         category: "Entertainment",
         media_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
         media_type: "video",
         source_name: "Cityscapes",
         source_url: "https://tiktok.com",
         tags: ["City", "Cinematic"],
         popularity_score: 15600
      },
      {
         title: "Relaxing Ocean Waves 🌊",
         description: "Take a deep breath and listen to the sound of the ocean. #relax #asmr #ocean",
         category: "Others",
         media_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
         media_type: "video",
         source_name: "Nature ASMR",
         source_url: "https://youtube.com/shorts",
         tags: ["ASMR", "Ocean"],
         popularity_score: 11000
      }
    ];
    newItems.push(...reels);

    // Insert into DB
    let insertedCount = 0;
    for (const item of newItems) {
      // Check duplicate
      const { data: existing } = await insforge.database
        .from('trending_content')
        .select('id')
        .eq('source_url', item.source_url)
        .single();
        
      if (!existing) {
        await insforge.database.from('trending_content').insert([item]);
        insertedCount++;
      }
    }

    return NextResponse.json({ success: true, count: insertedCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
