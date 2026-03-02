'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle } from 'lucide-react';
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
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setIsLoading(true);

    // Simulate AI response (replace with actual API call when ready)
    await new Promise((r) => setTimeout(r, 800));
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: `I'm your BookGPT assistant. You asked: "${text}"\n\nSelect a book from your Library to have voice conversations with AI about that specific book. This chat interface is ready for you to connect your preferred AI API.`,
      },
    ]);
    setIsLoading(false);
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
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
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
