'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Plus, Paperclip, ChevronDown, Languages, Youtube, Link, PanelLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  chatId?: string | null;
  initialMessages?: ChatMessage[];
  onMessagesSaved?: () => void;
  onChatCreated?: (id: string) => void;
  onOpenSidebar?: () => void;
}

const SUGGESTIONS = [
  'Summarize a book for me',
  'Explain a concept from my library',
  'What books should I read next?',
  'Help me understand a chapter',
];

const MODEL_OPTIONS = [
  { value: 'openai/gpt-oss-120b', name: 'GPT-OSS Standard', description: 'Most capable for complex tasks' },
  { value: 'qwen/qwen3-32b', name: 'Qwen3', description: 'Efficient for everyday tasks' },
  { value: 'openai/gpt-oss-20b', name: 'GPT-OSS Lite', description: 'Fastest for quick answers' },
];

const LANGUAGE_OPTIONS = [
  { value: 'en', name: 'English' },
  { value: 'ta', name: 'Tamil' },
];

const ChatInterface = ({
  chatId = null,
  initialMessages = [],
  onMessagesSaved,
  onChatCreated,
  onOpenSidebar,
}: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const currentChatIdRef = useRef<string | null>(chatId);

  useEffect(() => {
    setMessages(initialMessages);
    currentChatIdRef.current = chatId;
  }, [chatId, initialMessages]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [pasteUrlType, setPasteUrlType] = useState<'youtube' | 'website' | null>(null);
  const [pasteUrlValue, setPasteUrlValue] = useState('');
  const [modelOpen, setModelOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODEL_OPTIONS[0]);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGE_OPTIONS[0]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const attachRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (attachRef.current && !attachRef.current.contains(e.target as Node)) {
        setAttachOpen(false);
      }
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setModelOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(e.target as Node)) {
        setLanguageOpen(false);
      }
    };
    if (attachOpen || modelOpen || languageOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [attachOpen, modelOpen, languageOpen]);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const saveMessagesToChat = async (chatIdToSave: string | null, msgs: ChatMessage[]) => {
    if (!chatIdToSave) return;
    try {
      const res = await fetch(`/api/chats/${chatIdToSave}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs }),
      });
      if (res.ok) onMessagesSaved?.();
    } catch (e) {
      console.error('Failed to save chat:', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent, customText?: string) => {
    e.preventDefault();
    let text = customText || input.trim();
    const url = pasteUrlValue.trim();
    if (!text && !url) return;

    if (url) {
      const urlLabel = pasteUrlType === 'youtube' ? 'YouTube video' : 'Website';
      text = text ? `[${urlLabel}]: ${url}\n\n${text}` : `[${urlLabel}]: ${url}\n\nPlease help me with this.`;
      setPasteUrlValue('');
      setPasteUrlType(null);
    }
    setInput('');
    const userMessage: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    let activeChatId = currentChatIdRef.current;
    if (!activeChatId) {
      try {
        const createRes = await fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: text.slice(0, 50) }),
        });
        if (createRes.ok) {
          const chat = await createRes.json();
          const newId = chat._id as string;
          activeChatId = newId;
          currentChatIdRef.current = newId;
          onChatCreated?.(newId);
        }
      } catch (err) {
        console.error('Failed to create chat:', err);
      }
    }

    const apiMessages = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          model: selectedModel.value,
          language: selectedLanguage.value,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `API error: ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      if (reader) {
        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = {
              role: 'assistant',
              content: assistantContent,
            };
            return next;
          });
        }
      }
      if (activeChatId) {
        const finalMessages = [...apiMessages, { role: 'assistant' as const, content: assistantContent }];
        await saveMessagesToChat(activeChatId, finalMessages);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${err instanceof Error ? err.message : 'Something went wrong'}`,
        },
      ]);
      if (activeChatId) {
        await saveMessagesToChat(activeChatId, [...apiMessages, { role: 'assistant' as const, content: `Error: ${err instanceof Error ? err.message : 'Something went wrong'}` }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="chatgpt-container">
      {/* Mobile: menu button to open sidebar */}
      {onOpenSidebar && (
        <div className="md:hidden flex items-center px-4 py-3 border-b border-[var(--border-subtle)] shrink-0">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="p-2 rounded-lg text-[#212a3b] hover:bg-[var(--bg-secondary)] transition-colors"
            aria-label="Open chat history"
          >
            <PanelLeft className="size-5" />
          </button>
        </div>
      )}
      <div ref={scrollRef} className="chatgpt-messages">
        {isEmpty ? (
          <div className="chatgpt-empty">
            <div className="chatgpt-empty-icon">
              <MessageCircle className="size-16 text-[#212a3b]" />
            </div>
            <h1 className="chatgpt-empty-title">How can I help you today?</h1>
            <p className="chatgpt-empty-subtitle">
              Ask me anything about your books or start a voice chat with a book from your library.
            </p>
            <div className="chatgpt-suggestions">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={(e) => handleSubmit(e, suggestion)}
                  className="chatgpt-suggestion-chip"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="chatgpt-message-list">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'chatgpt-message',
                  msg.role === 'user' ? 'chatgpt-message-user' : 'chatgpt-message-assistant'
                )}
              >
                <div
                  className={cn(
                    'chatgpt-bubble',
                    msg.role === 'user' ? 'chatgpt-bubble-user' : 'chatgpt-bubble-assistant'
                  )}
                >
                  {msg.role === 'assistant' ? (
                    <div className="chatgpt-markdown">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isLoading &&
              (messages.length === 0 || messages[messages.length - 1]?.role === 'user') && (
                <div className="chatgpt-message chatgpt-message-assistant">
                  <div className="chatgpt-bubble chatgpt-bubble-assistant">
                    <span className="chatgpt-typing">
                      <span />
                      <span />
                      <span />
                    </span>
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      <div className="chatgpt-input-wrapper">
        {pasteUrlType && (
          <div className="chatgpt-paste-url-bar">
            <span className="chatgpt-paste-url-label">
              {pasteUrlType === 'youtube' ? 'YouTube URL' : 'Website URL'}:
            </span>
            <input
              type="url"
              value={pasteUrlValue}
              onChange={(e) => setPasteUrlValue(e.target.value)}
              placeholder={`Paste ${pasteUrlType === 'youtube' ? 'YouTube' : 'website'} link here...`}
              className="chatgpt-paste-url-input"
              autoFocus
            />
            <button
              type="button"
              onClick={() => {
                setPasteUrlValue('');
                setPasteUrlType(null);
              }}
              className="chatgpt-paste-url-close"
              aria-label="Cancel"
            >
              ×
            </button>
          </div>
        )}
        <form
          onSubmit={(e) => handleSubmit(e)}
          className="chatgpt-input-form"
        >
         <div className='chatgpt-input-area'>
         <div className='flex flex-1'>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Message BookGPT..."
              disabled={isLoading}
              className="chatgpt-input"
              rows={3}
            />
          </div>
          <div className="chatgpt-options-wrap">
          <div ref={attachRef} className="chatgpt-attach-wrap">
            <button
              type="button"
              onClick={() => setAttachOpen((o) => !o)}
              disabled={isLoading}
              className="chatgpt-attach-btn"
              aria-label="Add attachments"
            >
              <Plus className="size-5" />
            </button>
            {attachOpen && (
              <div className="chatgpt-attach-dropdown">
                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                    setAttachOpen(false);
                  }}
                  className="chatgpt-attach-option"
                >
                  <Paperclip className="size-4" />
                  Add files
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPasteUrlType('youtube');
                    setAttachOpen(false);
                  }}
                  className="chatgpt-attach-option"
                >
                  <Youtube className="size-4" />
                  YouTube URL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPasteUrlType('website');
                    setAttachOpen(false);
                  }}
                  className="chatgpt-attach-option"
                >
                  <Link className="size-4" />
                  Website URL
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = e.target.files;
                if (files?.length) {
                  console.log('Files selected:', Array.from(files).map((f) => f.name));
                  // TODO: handle file upload / attach to message
                }
                e.target.value = '';
              }}
            />
          </div>
            <div ref={languageRef} className="chatgpt-option-wrap">
              <button
                type="button"
                onClick={() => setLanguageOpen((o) => !o)}
                className="chatgpt-model-btn"
                aria-label="Choose language"
              >
                <Languages className="size-4 shrink-0" />
                <span className="chatgpt-model-btn-text">{selectedLanguage.name}</span>
                <ChevronDown className="size-4 shrink-0" />
              </button>
              {languageOpen && (
                <div className="chatgpt-model-dropdown">
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSelectedLanguage(opt);
                        setLanguageOpen(false);
                      }}
                      className={cn(
                        'chatgpt-model-option chatgpt-model-option-simple',
                        selectedLanguage.value === opt.value && 'chatgpt-model-option-active'
                      )}
                    >
                      {opt.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div ref={modelRef} className="chatgpt-option-wrap">
              <button
                type="button"
                onClick={() => setModelOpen((o) => !o)}
                className="chatgpt-model-btn"
                aria-label="Choose model"
              >
                <span className="chatgpt-model-btn-text">{selectedModel.name}</span>
                <ChevronDown className="size-4 shrink-0" />
              </button>
              {modelOpen && (
                <div className="chatgpt-model-dropdown">
                  {MODEL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSelectedModel(opt);
                        setModelOpen(false);
                      }}
                      className={cn(
                        'chatgpt-model-option',
                        selectedModel.value === opt.value && 'chatgpt-model-option-active'
                      )}
                    >
                      <div className="chatgpt-model-option-main">
                        <span className="font-medium">{opt.name}</span>
                      </div>
                      <p className="chatgpt-model-option-desc">{opt.description}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
         </div>
          <button
            type="submit"
            disabled={(!input.trim() && !pasteUrlValue.trim()) || isLoading}
            className="chatgpt-send-btn"
          >
            <Send className="size-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
