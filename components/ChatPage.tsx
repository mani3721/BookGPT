'use client';

import { useState, useEffect, useCallback } from 'react';
import ChatSidebar from './ChatSidebar';
import ChatInterface from './ChatInterface';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const ChatPage = () => {
  const [chatId, setChatId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadChat = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/chats/${id}`);
      if (res.ok) {
        const chat = await res.json();
        setInitialMessages(chat.messages || []);
      }
    } catch (e) {
      console.error('Failed to load chat:', e);
      setInitialMessages([]);
    }
  }, []);

  useEffect(() => {
    if (chatId) {
      loadChat(chatId);
    } else {
      setInitialMessages([]);
    }
  }, [chatId, loadChat]);

  const handleNewChat = async () => {
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' }),
      });
      if (res.ok) {
        const chat = await res.json();
        setChatId(chat._id);
        setInitialMessages([]);
        setRefreshTrigger((t) => t + 1);
      }
    } catch (e) {
      console.error('Failed to create chat:', e);
    }
  };

  const handleSelectChat = (id: string | null) => {
    setChatId(id);
  };

  return (
    <div className="flex w-full h-[calc(100vh-var(--navbar-height,80px))] min-h-0">
      <ChatSidebar
        chatId={chatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        refreshTrigger={refreshTrigger}
      />
      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        <ChatInterface
          chatId={chatId}
          initialMessages={initialMessages}
          onMessagesSaved={() => setRefreshTrigger((t) => t + 1)}
          onChatCreated={(id) => {
            setChatId(id);
            setRefreshTrigger((t) => t + 1);
          }}
        />
      </div>
    </div>
  );
};

export default ChatPage;
