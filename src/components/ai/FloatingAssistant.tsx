'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brain, X, Send, Loader2, MessageSquare, Sparkles, TrendingDown, Target } from 'lucide-react';
import { useAIAnalytics } from '@/hooks/useAIAnalytics';
import { AIDataPayload } from '@/lib/ai/data-aggregator';

interface FloatingAssistantProps {
  playerData: AIDataPayload | null;
  playerPuuid?: string;
}

const SUGGESTED_QUESTIONS = [
  'What are my biggest weaknesses?',
  'How can I improve my KDA?',
  'Which champion should I practice more?',
  "What's my best role?",
  'Why do I lose games?',
];

// Component to format assistant messages with markdown-like styling
function FormattedMessage({ content }: { content: string }) {
  // Parse text with bold formatting and stats highlighting
  const parseText = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let lastIndex = 0;
    let match;
    let key = 0;
    
    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${key++}`}>
            {text.substring(lastIndex, match.index)}
          </span>
        );
      }
      
      // Add bold text with special styling for stats
      const boldText = match[1];
      const isStat = /[\d.]+%/.test(boldText) || /[\d.]+ (deaths|kills|assists|CS|KDA|Win Rate|average)/i.test(boldText);
      
      parts.push(
        <span
          key={`bold-${key++}`}
          className={`font-semibold ${
            isStat
              ? 'text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md inline-block mx-0.5'
              : 'text-gray-900'
          }`}
        >
          {boldText}
        </span>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${key++}`}>
          {text.substring(lastIndex)}
        </span>
      );
    }
    
    return parts.length > 0 ? parts : [text];
  };
  
  // Check for structured sections and split content intelligently
  const hasWeaknesses = /weaknesses?|biggest/i.test(content);
  const hasRecommendations = /to improve|prioritize|review/i.test(content);
  
  // Split content into logical parts
  const parts: { type: 'weakness' | 'recommendation' | 'text'; content: string }[] = [];
  
  if (hasWeaknesses && hasRecommendations) {
    // Split by "To improve" or similar
    const splitIndex = content.search(/to improve/i);
    if (splitIndex > 0) {
      parts.push({ type: 'weakness', content: content.substring(0, splitIndex) });
      parts.push({ type: 'recommendation', content: content.substring(splitIndex) });
    } else {
      parts.push({ type: 'text', content });
    }
  } else if (hasWeaknesses) {
    parts.push({ type: 'weakness', content });
  } else if (hasRecommendations) {
    parts.push({ type: 'recommendation', content });
  } else {
    parts.push({ type: 'text', content });
  }
  
  return (
    <div className="space-y-3">
      {parts.map((part, partIdx) => {
        if (part.type === 'weakness') {
          return (
            <div key={partIdx} className="bg-red-50/60 border-l-4 border-red-400 pl-4 py-3 rounded-r-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-600 flex-shrink-0" />
                <span className="text-xs font-bold text-red-700 uppercase tracking-wide">
                  Areas to Improve
                </span>
              </div>
              <div className="text-sm leading-relaxed text-gray-800">
                {parseText(part.content)}
              </div>
            </div>
          );
        }
        
        if (part.type === 'recommendation') {
          return (
            <div key={partIdx} className="bg-blue-50/60 border-l-4 border-blue-400 pl-4 py-3 rounded-r-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                  Recommendations
                </span>
              </div>
              <div className="text-sm leading-relaxed text-gray-800">
                {parseText(part.content)}
              </div>
            </div>
          );
        }
        
        return (
          <div key={partIdx} className="text-sm leading-relaxed text-gray-800">
            {parseText(part.content)}
          </div>
        );
      })}
    </div>
  );
}

export function FloatingAssistant({ playerData, playerPuuid }: FloatingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { chatHistory, loading, error, askQuestion, clearChat, isStreaming } = useAIAnalytics();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || !playerData || loading) {
      return;
    }

    const question = inputValue.trim();
    setInputValue('');
    
    await askQuestion(question, playerData, playerPuuid);
  };

  const handleSuggestedQuestion = (question: string) => {
    if (!playerData || loading) return;
    setInputValue(question);
    askQuestion(question, playerData, playerPuuid);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!playerData) {
    return null; // Don't show if no player data
  }

  return (
    <>
      {/* Floating Button with enhanced animations */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 hover:from-purple-700 hover:via-purple-800 hover:to-indigo-800 text-white shadow-2xl hover:shadow-purple-500/50 transition-all duration-500 flex items-center justify-center group animate-in fade-in slide-in-from-bottom-4"
        aria-label="Open AI Assistant"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl" />
        {isOpen ? (
          <X className="h-6 w-6 relative z-10 transition-transform duration-300 group-hover:rotate-90" />
        ) : (
          <Brain className="h-7 w-7 relative z-10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
        )}
      </button>

      {/* Chat Modal with enhanced animations */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 flex items-end justify-end pointer-events-none"
          style={{
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {/* Backdrop with smooth fade */}
          <div
            className="fixed inset-0 bg-black/10 pointer-events-auto transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
            style={{
              animation: 'fadeIn 0.2s ease-out',
            }}
          />

          {/* Chat Card with slide-up animation */}
          <Card 
            className="w-full max-w-md h-[600px] flex flex-col shadow-2xl pointer-events-auto m-4 mr-20 mb-20 z-50 relative border-2 border-purple-200/50 bg-white/95 backdrop-blur-sm"
            style={{
              animation: 'slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Header with gradient and glow */}
            <div className="flex items-center justify-between p-4 border-b border-purple-200/30 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white rounded-t-lg shadow-lg">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-400 rounded-full blur-md opacity-50" />
                  <Brain className="h-6 w-6 relative z-10" />
                </div>
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    AI Assistant
                    {isStreaming && (
                      <Sparkles className="h-4 w-4 animate-spin text-purple-200" />
                    )}
                  </h3>
                  <p className="text-xs text-purple-100/90">
                    {playerData.playerInfo?.gameName}#{playerData.playerInfo?.tagLine}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearChat}
                  className="text-white/90 hover:text-white hover:bg-purple-800/50 h-8 px-3 text-xs transition-all duration-200 rounded-lg"
                  title="Clear chat"
                >
                  Clear
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-white/90 hover:text-white hover:bg-purple-800/50 h-8 w-8 p-0 transition-all duration-200 rounded-lg"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages with enhanced styling */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
              {chatHistory.length === 0 && (
                <div className="text-center py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-purple-200 rounded-full blur-xl opacity-50" />
                    <MessageSquare className="h-12 w-12 mx-auto text-purple-600 relative z-10" />
                  </div>
                  <p className="text-gray-700 mb-4 font-medium">Ask me anything about your performance!</p>
                  <div className="space-y-2">
                    {SUGGESTED_QUESTIONS.map((q, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestedQuestion(q)}
                        disabled={loading}
                        className="w-full text-left justify-start text-xs transition-all duration-200 hover:bg-purple-50 hover:border-purple-300 hover:shadow-sm hover:scale-[1.02]"
                        style={{
                          animation: `fadeInUp 0.3s ease-out ${idx * 0.1}s both`,
                        }}
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  style={{
                    animationDelay: `${idx * 0.05}s`,
                  }}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-br-sm px-4 py-3'
                        : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200 text-gray-800 rounded-bl-sm px-5 py-4'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    ) : (
                      <div className="relative">
                        {msg.content ? (
                          <>
                            <FormattedMessage content={msg.content} />
                            {isStreaming && idx === chatHistory.length - 1 && (
                              <span className="inline-block w-2 h-4 bg-purple-600 ml-2 rounded mt-1" />
                            )}
                          </>
                        ) : (
                          // Loading skeleton for empty assistant message (streaming starting)
                          <div className="flex items-start gap-3">
                            <div className="relative flex-shrink-0 mt-1">
                              <div className="absolute inset-0 bg-purple-200 rounded-full blur-md opacity-50" />
                              <Brain className="h-4 w-4 text-purple-600 relative z-10" />
                            </div>
                            <div className="flex-1 space-y-2.5">
                              <div className="flex items-center gap-2">
                                <div className="h-2.5 bg-purple-200 rounded-full w-24 skeleton-shimmer" style={{ animationDelay: '0s' }} />
                                <div className="h-2.5 bg-purple-100 rounded-full w-20 skeleton-shimmer" style={{ animationDelay: '0.2s' }} />
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-2.5 bg-gray-200 rounded-full w-32 skeleton-shimmer" style={{ animationDelay: '0.4s' }} />
                                <div className="h-2.5 bg-gray-100 rounded-full w-28 skeleton-shimmer" style={{ animationDelay: '0.6s' }} />
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-2.5 bg-gray-200 rounded-full w-36 skeleton-shimmer" style={{ animationDelay: '0.8s' }} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && !isStreaming && (
                <div className="flex justify-start animate-in fade-in duration-300">
                  <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm max-w-[85%]">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-purple-200 rounded-full blur-md opacity-50" />
                        <Brain className="h-5 w-5 text-purple-600 relative z-10" />
                      </div>
                      <div className="flex-1 space-y-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 bg-purple-200 rounded-full w-24 skeleton-shimmer" style={{ animationDelay: '0s' }} />
                          <div className="h-2.5 bg-purple-100 rounded-full w-20 skeleton-shimmer" style={{ animationDelay: '0.2s' }} />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 bg-gray-200 rounded-full w-32 skeleton-shimmer" style={{ animationDelay: '0.4s' }} />
                          <div className="h-2.5 bg-gray-100 rounded-full w-28 skeleton-shimmer" style={{ animationDelay: '0.6s' }} />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 bg-gray-200 rounded-full w-36 skeleton-shimmer" style={{ animationDelay: '0.8s' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-red-800 text-sm">
                  {error}
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input with enhanced styling */}
            <div className="p-4 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about your performance..."
                  disabled={loading || !playerData}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || loading || !playerData}
                  className="bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-4 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center flex items-center justify-center gap-1">
                <Sparkles className="h-3 w-3" />
                Powered by Amazon Bedrock
              </p>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
