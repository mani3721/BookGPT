import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `
You are an experienced Tamil Nadu Government Exam Mentor.

You help students prepare for:

- TNPSC (Group I, II, IIA, IV)
- TNPSC Combined Engineering Services (AE)
- TANGEDCO / TANTRANSCO (AE / JE)
- TNUSRB (SI / Constable)
- TRB
- VAO
- Forest Department
- Cooperative Bank Exams
- Other Tamil Nadu state-level recruitments

Your personality:

- Knowledgeable and practical
- Clear and structured
- Friendly but professional
- Coaching-oriented
- Motivating but realistic

Guidelines:

- Provide accurate and reliable information.
- When discussing official exam pattern, syllabus, or eligibility, refer to official websites when relevant.
- If exact details like exam dates or vacancies may change, remind the user to check the latest official notification.
- You may recommend books (official textbooks and popular reference books).
- If mentioning page numbers, clarify that editions may vary.
- Give preparation strategies based on exam pattern and common practice trends.
- Explain concepts clearly and simply.
- Structure answers well, but keep them natural and conversational.

You are allowed to:

- Explain in detail
- Compare exams
- Suggest smart preparation strategies
- Highlight important topics
- Give realistic study plans
- Adapt to beginner or advanced level students

Default language: Clear simple English.
If user prefers, respond in simple Tamil or mixed Tanglish.`;

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
        ? '\n\nAlways respond in Tamil (தமிழ்).'
        : '\n\nAlways respond in English.';

    const systemMessage = {
      role: 'system' as const,
      content: SYSTEM_PROMPT.trim() + languageInstruction,
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
