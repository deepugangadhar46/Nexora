import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Minimize2, Maximize2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  typing?: boolean;
}

const AIWidget = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Don't show on dashboard or other protected routes to avoid interference
  const hiddenRoutes = ['/dashboard', '/idea-validation', '/mvp-development', '/business-plan', '/marketing-strategy', '/team-collaboration', '/pitch-deck', '/profile', '/settings'];
  const shouldHide = hiddenRoutes.some(route => location.pathname.startsWith(route));
  
  if (shouldHide) {
    return null;
  }
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm NEXORA AI, your startup assistant. I can help you validate ideas, explain our features, or answer any questions about building your startup. What would you like to know?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    "How does NEXORA work?",
    "What's included in the free plan?",
    "Can you help validate my idea?",
    "How long does MVP generation take?",
    "Do I need technical skills?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close widget when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleSendMessage = async (content?: string) => {
    const messageContent = content || inputValue.trim();
    if (!messageContent) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(messageContent);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
      setIsLoading(false);
    }, 1500 + Math.random() * 1000);
  };

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('how') && lowerMessage.includes('work')) {
      return "NEXORA uses advanced AI agents that work together to automate your entire startup creation process. Simply describe your idea, and our AI will generate market research, create business plans, build MVPs, and prepare pitch decks - all in minutes! Would you like me to walk you through a specific feature?";
    }
    
    if (lowerMessage.includes('free') || lowerMessage.includes('plan') || lowerMessage.includes('price')) {
      return "Our free Starter plan includes 1 complete startup generation per month, basic market research, simple MVP templates, and standard business plans. It's perfect for testing ideas! You can upgrade anytime for unlimited generations and advanced features. Would you like to see our pricing details?";
    }
    
    if (lowerMessage.includes('validate') || lowerMessage.includes('idea')) {
      return "I'd love to help validate your startup idea! Our AI can analyze market potential, identify competitors, assess feasibility, and provide improvement suggestions. You can either use our Idea Validation tool or tell me about your idea right here. What's your startup concept?";
    }
    
    if (lowerMessage.includes('mvp') || lowerMessage.includes('development') || lowerMessage.includes('code')) {
      return "MVP generation typically takes 15-30 minutes depending on complexity. Our AI creates full-stack applications with modern tech stacks, responsive design, and production-ready code. No coding skills required - just describe what you want to build! Want to see an example?";
    }
    
    if (lowerMessage.includes('technical') || lowerMessage.includes('skills') || lowerMessage.includes('coding')) {
      return "Not at all! NEXORA is designed for entrepreneurs of all backgrounds. You just need to describe your idea in plain English, and our AI handles all the technical complexity. We've helped non-technical founders build successful startups and raise millions in funding. Your vision is all you need!";
    }
    
    if (lowerMessage.includes('time') || lowerMessage.includes('long') || lowerMessage.includes('fast')) {
      return "Most users get their complete startup package (research + business plan + MVP + pitch deck) in 15-30 minutes. Compare that to traditional methods which take 3-6 months and cost $50,000+. We've saved entrepreneurs over 156,000 hours collectively!";
    }
    
    if (lowerMessage.includes('support') || lowerMessage.includes('help')) {
      return "We provide comprehensive support including 24/7 chat support, detailed documentation, video tutorials, and weekly live Q&A sessions. Pro users get priority email support, and Enterprise customers have dedicated account managers. How can I help you right now?";
    }
    
    if (lowerMessage.includes('demo') || lowerMessage.includes('example') || lowerMessage.includes('show')) {
      return "I'd be happy to show you NEXORA in action! You can watch our demo video on the homepage, try our free plan, or I can schedule a personalized demo for you. We also have case studies showing how entrepreneurs raised $24M+ using our platform. What interests you most?";
    }
    
    // Default responses for general queries
    const defaultResponses = [
      "That's a great question! NEXORA is designed to help entrepreneurs like you build successful startups faster. Could you tell me more about what specific aspect you're interested in?",
      "I'm here to help you understand how NEXORA can accelerate your startup journey. What would you like to know more about - our AI agents, pricing, or specific features?",
      "Thanks for asking! NEXORA has helped thousands of entrepreneurs turn their ideas into successful businesses. What's your biggest challenge in building your startup right now?"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative bg-gradient-to-r from-pulse-500 to-pulse-600 text-white p-4 rounded-full shadow-2xl hover:shadow-pulse-500/25 transition-all duration-300 hover:scale-110"
        >
          <MessageCircle className="w-6 h-6" />
          
          {/* Notification Badge */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm">
            <div className="w-full h-full bg-green-500 rounded-full animate-pulse"></div>
          </div>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-3 px-4 py-2 bg-gray-900 text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-1 whitespace-nowrap shadow-xl">
            💬 Chat with NEXORA AI
            <div className="absolute top-full right-6 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-gray-900"></div>
          </div>
          
          {/* Floating Animation Rings */}
          <div className="absolute inset-0 rounded-full -z-10">
            <div className="absolute inset-0 rounded-full bg-pulse-400/20 animate-ping" style={{ animationDelay: '0s' }}></div>
            <div className="absolute inset-0 rounded-full bg-pulse-300/15 animate-ping scale-110" style={{ animationDelay: '1s' }}></div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50" ref={widgetRef}>
      <div className={cn(
        "bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300",
        isMinimized ? "w-80 h-16" : "w-96 h-[600px]"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-pulse-500 to-pulse-600 text-white rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h3 className="font-semibold">NEXORA AI</h3>
              <p className="text-xs text-white/80">Always here to help</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 h-96">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start space-x-3",
                    message.sender === 'user' ? "flex-row-reverse space-x-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    message.sender === 'user' 
                      ? "bg-pulse-100 text-pulse-600" 
                      : "bg-gray-100 text-gray-600"
                  )}>
                    {message.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  
                  <div className={cn(
                    "max-w-xs p-3 rounded-2xl",
                    message.sender === 'user'
                      ? "bg-pulse-500 text-white rounded-br-md"
                      : "bg-gray-100 text-gray-900 rounded-bl-md"
                  )}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className={cn(
                      "text-xs mt-1",
                      message.sender === 'user' ? "text-white/70" : "text-gray-500"
                    )}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="bg-gray-100 p-3 rounded-2xl rounded-bl-md">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length === 1 && (
              <div className="px-4 pb-4">
                <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.slice(0, 3).map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(question)}
                      className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about NEXORA..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pulse-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                  {inputValue && (
                    <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-pulse-500" />
                  )}
                </div>
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  className={cn(
                    "p-2 rounded-full transition-all duration-200",
                    inputValue.trim() && !isLoading
                      ? "bg-pulse-500 text-white hover:bg-pulse-600 hover:scale-105"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  )}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-xs text-gray-500 mt-2 text-center">
                Powered by NEXORA AI • Always learning, always helping
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AIWidget;
