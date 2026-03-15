import { NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';

export async function POST(req: Request) {
  try {
    const { message, content } = await req.json();

    if (!message || !content) {
      return NextResponse.json({ error: 'Missing message or content context' }, { status: 400 });
    }

    const systemPrompt = `You are a helpful AI assistant analyzing a trending piece of content.
Here are the details of the content:
Title: ${content.title}
Category: ${content.category}
Source: ${content.source_name} (${content.source_url})
Description: ${content.description}

Answer the user's question concisely based on the above information. If they ask a general question, use your world knowledge to supplement if needed, but primarily summarize and explain the content.
`;

    const completion = await insforge.ai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'user', content: systemPrompt + "\n\nUser Question: " + message }
      ]
    });

    const text = completion.choices[0]?.message?.content || 'Sorry, I could not generate an answer.';

    return NextResponse.json({ reply: text });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
