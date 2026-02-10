import React, { useEffect, useRef, useState } from 'react';
import { Send, Bot, User, Sparkles, Lightbulb, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { Message, TutorialStepConfig } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onResendMessage: () => void;
  isLoading: boolean;
  isCompleted: boolean;
  onNextScenario: () => void;
  isTutorialMode?: boolean;
  tutorialConfig?: TutorialStepConfig;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  onResendMessage,
  isLoading, 
  isCompleted, 
  onNextScenario,
  isTutorialMode,
  tutorialConfig
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, tutorialConfig]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const getRoleIcon = (role: string) => {
      if (role === 'user') return <User size={16} />;
      if (role === 'guide') return <ShieldCheck size={16} />;
      return <Bot size={16} />;
  };

  const getRoleStyles = (role: string) => {
      if (role === 'user') return 'bg-gray-800 text-white';
      // Made Guide icon background stronger red
      if (role === 'guide') return 'bg-red-100 text-red-600 ring-2 ring-red-200 ring-offset-1'; 
      return isTutorialMode ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600';
  };

  const getMessageStyles = (role: string, text: string) => {
      // Special style for the error message
      if (role === 'model' && text.includes("trouble thinking straight")) {
          return 'bg-red-50 border border-red-200 text-red-700 rounded-tl-none';
      }
      if (role === 'user') return 'bg-gray-800 text-white rounded-tr-none';
      
      // Made Guide bubble clearly RED with thicker border
      if (role === 'guide') return 'bg-red-50 border-2 border-red-200 text-red-900 rounded-tl-none shadow-sm';
      
      return 'bg-white border border-gray-200 text-gray-700 rounded-tl-none';
  };

  // Check if the last message is an error message
  const lastMessageIsError = messages.length > 0 && messages[messages.length - 1].text.includes("trouble thinking straight");

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-2 bg-gray-50/50">
        <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isTutorialMode ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
            <Bot size={18} />
            </div>
            <div>
            <h3 className="font-semibold text-gray-800">{isTutorialMode ? 'GraphGullible (Training Mode)' : 'GraphGullible AI'}</h3>
            <p className="text-xs text-gray-500">{isTutorialMode ? 'Guided Session' : 'Learning from you...'}</p>
            </div>
        </div>
        
        {/* Persistent Refresh Button */}
        {!isLoading && !isCompleted && (
            <button 
                onClick={onResendMessage}
                className={`p-2 rounded-full transition-colors ${lastMessageIsError ? 'bg-red-100 text-red-600 animate-pulse' : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-100'}`}
                title="Retry last connection"
            >
                <RefreshCw size={18} />
            </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex max-w-[85%] md:max-w-[75%] gap-2 ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${getRoleStyles(msg.role)}`}
              >
                {msg.text.includes("trouble thinking straight") ? <AlertCircle size={16} /> : getRoleIcon(msg.role)}
              </div>
              <div
                className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${getMessageStyles(msg.role, msg.text)}`}
              >
                {msg.role === 'guide' && (
                    <div className="flex items-center gap-1.5 text-xs font-bold mb-1 text-red-600 uppercase tracking-wider border-b border-red-100 pb-1">
                        <ShieldCheck size={12} className="fill-red-100" />
                        Guide Intervention
                    </div>
                )}
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start w-full animate-fadeIn">
             <div className="flex flex-col gap-2 max-w-[75%]">
                <div className="flex gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isTutorialMode ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    <Bot size={16} />
                    </div>
                    <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full animate-bounce ${isTutorialMode ? 'bg-amber-400' : 'bg-indigo-400'}`} style={{ animationDelay: '0ms' }} />
                    <div className={`w-2 h-2 rounded-full animate-bounce ${isTutorialMode ? 'bg-amber-400' : 'bg-indigo-400'}`} style={{ animationDelay: '150ms' }} />
                    <div className={`w-2 h-2 rounded-full animate-bounce ${isTutorialMode ? 'bg-amber-400' : 'bg-indigo-400'}`} style={{ animationDelay: '300ms' }} />
                    </div>
                </div>
                
                {/* Immediate Resend Button (during loading) */}
                <button 
                  onClick={onResendMessage}
                  className="self-start ml-10 flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 transition-colors py-1 px-2 rounded-md hover:bg-gray-50"
                  title="Resend last message"
                >
                   <RefreshCw size={12} />
                   <span>Taking too long? Retry</span>
                </button>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input / Next Action / Tutorial Options */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/30">
        {isCompleted ? (
          <button
            onClick={onNextScenario}
            className={`w-full py-3 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg ${isTutorialMode ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
          >
            <Sparkles size={18} />
            {isTutorialMode ? "Next Training Step" : "Start Next Challenge"}
          </button>
        ) : lastMessageIsError ? (
            // Error State: Show BIG Retry Button
             <button
                onClick={onResendMessage}
                className="w-full py-3 text-white bg-red-500 hover:bg-red-600 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-200"
            >
                <RefreshCw size={18} />
                Retry Connection
            </button>
        ) : tutorialConfig ? (
          // Tutorial Mode: Inline Options
          <div className="space-y-3 animate-slideUp">
             <div className="flex items-start gap-3 text-sm text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-100">
                <Lightbulb className="flex-shrink-0 mt-0.5 text-amber-600" size={18} />
                <div>
                   <span className="font-bold block mb-1 text-amber-700">Hint:</span>
                   <span className="font-medium">{tutorialConfig.guideMessage}</span>
                </div>
             </div>
             
             {isLoading ? (
               // While loading in Tutorial Mode, show disabled button
                <div className="flex flex-col gap-2 items-center justify-center py-4">
                     <span className="text-sm text-gray-400 animate-pulse">Waiting for response...</span>
                </div>
             ) : (
                <div className="grid gap-2">
                {tutorialConfig.options.map((opt, i) => (
                    <button
                        key={i}
                        onClick={() => onSendMessage(opt)}
                        disabled={isLoading}
                        className="w-full text-left px-4 py-3 bg-white border border-gray-200 hover:border-amber-400 hover:bg-amber-50 text-gray-700 hover:text-amber-900 text-sm rounded-xl transition-all shadow-sm font-medium"
                    >
                        {opt}
                    </button>
                ))}
                </div>
             )}
          </div>
        ) : (
          // Normal Mode: Text Input
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isLoading ? "Bot is thinking..." : "Teach the bot..."}
              disabled={isLoading}
              className="w-full pl-4 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm shadow-sm"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="absolute right-2 p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-gray-900 transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;