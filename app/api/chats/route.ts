import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getChats, createChat } from '@/lib/actions/chat.actions';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await getChats();
    if (!result.success) {
      return NextResponse.json(
        { error: result.error instanceof Error ? result.error.message : 'Failed to fetch chats' },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('GET /api/chats error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const title = (body.title as string) || 'New Chat';

    const result = await createChat(title);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error instanceof Error ? result.error.message : 'Failed to create chat' },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('POST /api/chats error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
