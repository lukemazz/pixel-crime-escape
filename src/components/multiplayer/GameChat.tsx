
import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../../types/game';

interface GameChatProps {
  messages: ChatMessage[];
}

const GameChat: React.FC<GameChatProps> = ({ messages }) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll al fondo quando arrivano nuovi messaggi
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  if (messages.length === 0) {
    return null;
  }
  
  return (
    <div 
      ref={chatContainerRef}
      className="absolute left-2 top-2 w-64 max-h-[200px] overflow-y-auto bg-black bg-opacity-60 rounded p-2 text-sm z-40"
    >
      {messages.slice(-8).map((message, index) => (
        <div 
          key={index} 
          className={`mb-1 ${message.type === 'system' ? 'text-yellow-400' : 'text-white'}`}
        >
          <span className="font-bold">{message.sender}: </span>
          <span>{message.text}</span>
        </div>
      ))}
    </div>
  );
};

export default GameChat;
