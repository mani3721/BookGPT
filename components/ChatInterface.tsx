'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Summarize a book for me',
  'Explain a concept from my library',
  'What books should I read next?',
  'Help me understand a chapter',
];

const ChatInterface = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent, customText?: string) => {
    e.preventDefault();
    const text = customText || input.trim();
    if (!text) return;

    setInput('');
    const userMessage: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const apiMessages = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
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
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${err instanceof Error ? err.message : 'Something went wrong'}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="chatgpt-container">
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
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
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
        <form
          onSubmit={(e) => handleSubmit(e)}
          className="chatgpt-input-form"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message BookGPT..."
            disabled={isLoading}
            className="chatgpt-input"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
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
