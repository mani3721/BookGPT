'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatItem {
  _id: string;
  title: string;
  updatedAt?: string;
  createdAt?: string;
}

interface ChatSidebarProps {
  chatId: string | null;
  onSelectChat: (id: string | null) => void;
  onNewChat: () => void;
  refreshTrigger?: number;
  mobileSidebarOpen?: boolean;
  onMobileSidebarClose?: () => void;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24 && date.getDate() === now.getDate()) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays === 1) return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

function groupChatsByTime(chats: ChatItem[]): { label: string; chats: ChatItem[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const last7Days = new Date(today);
  last7Days.setDate(last7Days.getDate() - 7);

  const groups: { label: string; chats: ChatItem[] }[] = [
    { label: 'TODAY', chats: [] },
    { label: 'YESTERDAY', chats: [] },
    { label: 'LAST 7 DAYS', chats: [] },
  ];

  chats.forEach((chat) => {
    const d = new Date(chat.updatedAt || chat.createdAt || 0);
    if (d >= today) groups[0].chats.push(chat);
    else if (d >= yesterday) groups[1].chats.push(chat);
    else if (d >= last7Days) groups[2].chats.push(chat);
  });

  return groups.filter((g) => g.chats.length > 0);
}

const ChatSidebar = ({
  chatId,
  onSelectChat,
  onNewChat,
  refreshTrigger = 0,
  mobileSidebarOpen = false,
  onMobileSidebarClose,
}: ChatSidebarProps) => {
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

  const groupedChats = groupChatsByTime(chats);

  const isMobileOpen = mobileSidebarOpen;
  // On mobile when open: always full width. On desktop: respect collapsed state.
  const showFullSidebar = isMobileOpen || !collapsed;

  return (
    <div
      className={cn(
        'chat-sidebar',
        showFullSidebar ? 'w-72' : 'w-14',
        isMobileOpen && 'chat-sidebar--mobile-open'
      )}
    >
      {showFullSidebar && (
        <>
          <div className="chat-sidebar-header">
            <Image src="/assets/logo.png" alt="BookGPT" width={36} height={22} className="object-contain" />
            <span className="font-bold text-lg text-[#212a3b]">BookGPT</span>
          </div>

          <div className="px-4 py-4 shrink-0">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">
              Chat History
            </h2>
            <button
              type="button"
              onClick={onNewChat}
              className="chat-sidebar-new-btn w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-[#663820] hover:bg-[#663820]/90 transition-colors"
            >
              <Plus className="size-4" />
              New Chat
            </button>
          </div>

          <div className="chat-sidebar-list flex-1 overflow-y-auto px-3 pb-4">
            {loading ? (
              <div className="px-3 py-4 text-sm text-[var(--text-muted)]">Loading...</div>
            ) : groupedChats.length === 0 ? (
              <div className="px-3 py-4 text-sm text-[var(--text-muted)]">No chats yet</div>
            ) : (
              <div className="space-y-6">
                {groupedChats.map((group) => (
                  <div key={group.label}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 px-1">
                      {group.label}
                    </h3>
                    <ul className="space-y-1.5">
                      {group.chats.map((chat) => (
                        <li key={chat._id}>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => onSelectChat(chat._id)}
                            onKeyDown={(e) => e.key === 'Enter' && onSelectChat(chat._id)}
                            className={cn(
                              'chat-sidebar-item flex flex-col gap-0.5 px-3 py-2.5 rounded-xl transition-colors group cursor-pointer',
                              chatId === chat._id
                                ? 'bg-[#f3e4c7] text-[#212a3b]'
                                : 'bg-[var(--bg-secondary)] text-[#212a3b] hover:bg-[#f3e4c7]/70'
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-medium text-sm truncate flex-1">{chat.title}</span>
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
                            <span className="text-xs text-[var(--text-muted)]">
                              {formatRelativeTime(chat.updatedAt || chat.createdAt || new Date().toISOString())}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Collapse toggle - desktop only */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 items-center justify-center rounded-full bg-white border border-[var(--border-subtle)] shadow-sm text-[#212a3b] hover:bg-[var(--bg-secondary)] transition-colors"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
      </button>

      {/* Close button - mobile only */}
      {isMobileOpen && onMobileSidebarClose && (
        <button
          type="button"
          onClick={onMobileSidebarClose}
          className="md:hidden absolute top-4 right-4 p-2 rounded-lg text-[#212a3b] hover:bg-[var(--bg-secondary)] transition-colors"
          aria-label="Close sidebar"
        >
          <ChevronLeft className="size-5 rotate-180" />
        </button>
      )}

      {!showFullSidebar && (
        <div className="flex flex-col items-center py-4 gap-2">
          <Image src="/assets/logo.png" alt="BookGPT" width={28} height={18} className="object-contain" />
          <button
            type="button"
            onClick={onNewChat}
            className="p-2 rounded-lg text-[#663820] hover:bg-[#663820]/10 transition-colors"
            aria-label="New chat"
          >
            <Plus className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatSidebar;
