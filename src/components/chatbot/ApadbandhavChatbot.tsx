import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  findAnswer,
  suggestedQuestions,
  defaultResponse,
} from '@/data/chatbotQA';
import api from '@/services/api';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface ApadbandhavChatbotProps {
  userRole?: 'user' | 'police' | 'hospital' | 'guest';
}

const ApadbandhavChatbot = ({ userRole = 'guest' }: ApadbandhavChatbotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUserSentMessage, setHasUserSentMessage] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial welcome message
  const welcomeMessage: Message = {
    id: 0,
    text: "Hi - I am here to help answer any questions you have or direct you to the resources you are looking for. How can I assist you?",
    isBot: true,
    timestamp: new Date(),
  };

  // Initialize with welcome message when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([welcomeMessage]);
    }
  }, [isOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Save query to backend (only for logged-in users, not guests)
  const saveQueryToBackend = async (query: string, answer: string) => {
    // Don't save queries for guest users (public pages)
    if (userRole === 'guest') return;
    
    try {
      await api.post('/chatbot/query', {
        query,
        answer,
        role: userRole,
      });
    } catch (error) {
      console.error('Failed to save chatbot query:', error);
    }
  };

  const handleSendMessage = useCallback((text: string) => {
    if (!text.trim()) return;

    setHasUserSentMessage(true);

    const userMessage: Message = {
      id: Date.now(),
      text: text.trim(),
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate typing delay for natural feel
    setTimeout(() => {
      const result = findAnswer(text);
      const answerText = result ? result.answer : defaultResponse;
      const botResponse: Message = {
        id: Date.now() + 1,
        text: answerText,
        isBot: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);

      // Save query to backend
      saveQueryToBackend(text.trim(), answerText);
    }, 500 + Math.random() * 500);
  }, [userRole]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSendMessage(question);
  };

  const toggleChat = () => {
    setIsOpen(prev => !prev);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).toUpperCase();
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {/* Tooltip - shows on LEFT side until user sends first message */}
        {!hasUserSentMessage && !isOpen && (
          <div className="relative animate-fade-in bg-foreground dark:bg-card dark:border dark:border-border rounded-full px-4 py-2.5 shadow-lg">
            <p className="text-sm text-background dark:text-foreground font-medium whitespace-nowrap">Hi, how can I help?</p>
            {/* Arrow pointing right towards the button */}
            <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-b-[6px] border-l-[6px] border-transparent border-l-foreground dark:border-l-card" />
          </div>
        )}

        {/* Chat Button */}
        <button
          onClick={toggleChat}
          className="relative w-14 h-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group overflow-hidden"
          aria-label="Open chat"
        >
          {/* Logo */}
          <img
            src="/logoAB.png"
            alt="Apadbandhav"
            className="w-10 h-10 object-contain transition-transform duration-300 group-hover:scale-110"
          />
          
          {/* Pulse ring */}
          {!hasUserSentMessage && !isOpen && (
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping opacity-75" style={{ animationDuration: '2s' }} />
          )}
        </button>
      </div>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] h-[600px] max-h-[calc(100vh-100px)] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <img
                  src="/logoAB.png"
                  alt="Apadbandhav AI"
                  className="w-7 h-7 object-contain"
                />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Hi, I'm Apadbandhav AI!</h3>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleChat}
              className="h-8 w-8 rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages Area */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 px-4">
            <div className="py-4 space-y-4">
              {/* Date separator */}
              {messages.length > 0 && (
                <div className="text-center">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    {formatDate(messages[0].timestamp)}
                  </span>
                </div>
              )}

              {/* Messages */}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`flex gap-2 max-w-[85%] ${message.isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                    {message.isBot && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center mt-1">
                        <img
                          src="/logoAB.png"
                          alt="Bot"
                          className="w-5 h-5 object-contain"
                        />
                      </div>
                    )}
                    <div>
                      {message.isBot && (
                        <span className="text-xs text-muted-foreground ml-1 mb-1 block">Apadbandhav AI</span>
                      )}
                      <div
                        className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                          message.isBot
                            ? 'bg-muted text-foreground rounded-tl-md'
                            : 'bg-primary text-primary-foreground rounded-tr-md'
                        }`}
                      >
                        {message.text}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 block ml-1">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-2 items-end">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                      <img
                        src="/logoAB.png"
                        alt="Bot"
                        className="w-5 h-5 object-contain"
                      />
                    </div>
                    <div className="bg-muted px-4 py-3 rounded-2xl rounded-tl-md">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Suggested Questions - only show at start */}
              {messages.length === 1 && !isTyping && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs text-muted-foreground ml-10">Quick questions:</p>
                  <div className="flex flex-wrap gap-2 ml-10">
                    {suggestedQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestedQuestion(question)}
                        className="text-xs px-3 py-2 bg-card hover:bg-muted border border-border rounded-full text-foreground transition-colors duration-200 text-left"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t border-border p-3 bg-card">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary rounded-full px-4"
                disabled={isTyping}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!inputValue.trim() || isTyping}
                className="rounded-full h-10 w-10 bg-primary hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Powered by Apadbandhav
            </p>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default ApadbandhavChatbot;
