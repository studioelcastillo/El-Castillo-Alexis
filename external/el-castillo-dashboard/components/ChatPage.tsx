
import React from 'react';
import ChatInterface from './ChatInterface';

const ChatPage: React.FC = () => {
  return (
    <div className="h-[calc(100vh-80px)] w-full bg-white">
      <ChatInterface />
    </div>
  );
};

export default ChatPage;
