'use client';

import { useState, useEffect } from 'react';
import { MessageSquarePlus, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatItem {
  _id: string;
  title: string;
  updatedAt: string;
}

interface ChatSidebarProps {
  chatId: string | null;
  onSelectChat: (id: string | null) => void;
  onNewChat: () => void;
  refreshTrigger?: number;
}

const ChatSidebar = ({ chatId, onSelectChat, onNewChat, refreshTrigger = 0 }: ChatSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/chats');
      if (res.ok) {
        const data = await res.json();
        setChats(data);
      }
    } catch (e) {
      console.error('Failed to fetch chats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [refreshTrigger]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Delete this chat?')) return;
    try {
      const res = await fetch(`/api/chats/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setChats((prev) => prev.filter((c) => c._id !== id));
        if (chatId === id) onSelectChat(null);
      }
    } catch (e) {
      console.error('Failed to delete chat:', e);
    }
  };

  return (
    <div
      className={cn(
        'chat-sidebar flex flex-col bg-white border-r border-[var(--border-subtle)] transition-all duration-300',
        collapsed ? 'w-12' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between p-3 border-b border-[var(--border-subtle)] shrink-0">
        {!collapsed && (
          <button
            type="button"
            onClick={onNewChat}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#212a3b] bg-[var(--bg-secondary)] hover:bg-[var(--border-subtle)] transition-colors"
          >
            <Plus className="size-4" />
            New Chat
          </button>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="p-2 rounded-lg text-[#212a3b] hover:bg-[var(--bg-secondary)] transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </button>
      </div>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="px-3 py-4 text-sm text-[var(--text-muted)]">Loading...</div>
          ) : chats.length === 0 ? (
            <div className="px-3 py-4 text-sm text-[var(--text-muted)]">No chats yet</div>
          ) : (
            <ul className="space-y-0.5">
              {chats.map((chat) => (
                <li key={chat._id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectChat(chat._id)}
                    onKeyDown={(e) => e.key === 'Enter' && onSelectChat(chat._id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors group cursor-pointer',
                      chatId === chat._id
                        ? 'bg-[#663820]/10 text-[#663820]'
                        : 'text-[#212a3b] hover:bg-[var(--bg-secondary)]'
                    )}
                  >
                    <MessageSquarePlus className="size-4 shrink-0" />
                    <span className="flex-1 min-w-0 truncate">{chat.title}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(e, chat._id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 text-red-600 transition-opacity shrink-0"
                      aria-label="Delete chat"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatSidebar;
