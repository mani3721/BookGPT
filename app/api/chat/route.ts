import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const { messages, model, language } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const languageInstruction =
      language === 'ta'
        ? 'Always respond in Tamil (தமிழ்).'
        : 'Always respond in English.';

    const systemMessage = {
      role: 'system' as const,
      content: `You are BookGPT, a helpful AI assistant for book lovers. ${languageInstruction} Help users summarize books, explain concepts, recommend reads, and answer questions about their library. Use markdown for formatting.`,
    };

    const apiMessages = [
      systemMessage,
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const chatCompletion = await groq.chat.completions.create({
      model: model || process.env.GROQ_CHAT_MODEL || 'llama-3.3-70b-versatile',
      messages: apiMessages,
      temperature: 1,
      max_tokens: 8192,
      top_p: 1,
      stream: true,
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of chatCompletion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (err) {
          console.error('Groq stream error:', err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process chat' },
      { status: 500 }
    );
  }
}
