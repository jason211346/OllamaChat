import React from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import { Chat } from '../types';

interface SidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

export function Sidebar({ chats, currentChatId, onSelectChat, onNewChat }: SidebarProps) {
  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-screen">
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          New Chat
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-100 ${
              currentChatId === chat.id ? 'bg-gray-100' : ''
            }`}
          >
            <MessageSquare size={18} className="text-gray-500" />
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-gray-900">{chat.title}</p>
              <p className="text-xs text-gray-500">
                {new Date(chat.createdAt).toLocaleDateString()}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}