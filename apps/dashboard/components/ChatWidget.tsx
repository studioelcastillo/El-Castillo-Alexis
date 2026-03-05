
import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Maximize2 } from 'lucide-react';
import ChatInterface from './ChatInterface';

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isGlowing, setIsGlowing] = useState(false);

  // Reset counter when user opens the widget
  const handleToggle = () => {
    if (!isOpen) setUnreadCount(0);
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-[9998] flex flex-col items-end gap-2">
        <button
          onClick={handleToggle}
          className={`
            relative w-16 h-16 rounded-[24px] flex items-center justify-center text-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95
            ${isOpen ? 'bg-slate-900 rotate-90' : 'bg-amber-500 rotate-0'}
            ${isGlowing && !isOpen ? 'ring-4 ring-amber-500/30 animate-pulse' : ''}
          `}
        >
          {isOpen ? <X size={28} /> : <MessageSquare size={28} fill="currentColor" />}

          {/* Unread Badge */}
          {!isOpen && unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#F8FAFC] animate-in zoom-in">
              {unreadCount}
            </div>
          )}
        </button>
      </div>

      {/* Drawer / Modal Container */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] pointer-events-none flex justify-end">
          {/* Backdrop (Click to close) */}
          <div
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-300"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <div className="relative w-full max-w-lg h-full bg-white shadow-2xl pointer-events-auto flex flex-col animate-in slide-in-from-right duration-300">

             {/* Drawer Header (Simplified) */}
             <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50/50">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Chat Rápido</span>
                <div className="flex gap-2">
                   <button className="p-2 text-slate-400 hover:text-amber-600 transition-colors" title="Expandir">
                      <Maximize2 size={16} />
                   </button>
                   <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                      <X size={20} />
                   </button>
                </div>
             </div>

             {/* Reusing Chat Interface */}
             <div className="flex-1 overflow-hidden">
                <ChatInterface />
             </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
