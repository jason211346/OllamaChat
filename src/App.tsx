import React, { useState, useEffect } from 'react';
import { Message, ChatState, Chat } from './types';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { ModelSelector } from './components/ModelSelector';
import { Sidebar } from './components/Sidebar';
import { Trash2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:11434';

// Load chats from localStorage
const loadChats = (): Chat[] => {
  const saved = localStorage.getItem('chats');
  return saved ? JSON.parse(saved) : [];
};

// Save chats to localStorage
const saveChats = (chats: Chat[]) => {
  localStorage.setItem('chats', JSON.stringify(chats));
};

function App() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    selectedModel: 'llama2',
    chats: loadChats(),
    currentChatId: null,
  });
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    saveChats(state.chats);
  }, [state.chats]);

  const fetchModels = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tags`);
      const data = await response.json();
      const models = data.models.map((model: { name: string }) => model.name);
      setAvailableModels(models);
      if (models.length > 0) {
        setState(prev => ({ ...prev, selectedModel: models[0] }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to fetch models' }));
    }
  };

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      chats: [newChat, ...prev.chats],
      currentChatId: newChat.id,
      messages: [],
    }));
  };

  const selectChat = (chatId: string) => {
    const chat = state.chats.find(c => c.id === chatId);
    if (chat) {
      setState(prev => ({
        ...prev,
        currentChatId: chatId,
        messages: chat.messages,
      }));
    }
  };

  const updateChatTitle = (chatId: string, firstMessage: string) => {
    setState(prev => ({
      ...prev,
      chats: prev.chats.map(chat => 
        chat.id === chatId
          ? { ...chat, title: firstMessage.slice(0, 30) + (firstMessage.length > 30 ? '...' : '') }
          : chat
      )
    }));
  };

  const handleSendMessage = async (content: string) => {
    // Create new chat if none exists
    if (!state.currentChatId) {
      createNewChat();
    }

    const newMessage: Message = { role: 'user', content };
    const updatedMessages = [...state.messages, newMessage];

    setState(prev => ({
      ...prev,
      messages: updatedMessages,
      isLoading: true,
      error: null,
    }));

    // Update chat in storage
    setState(prev => ({
      ...prev,
      chats: prev.chats.map(chat =>
        chat.id === prev.currentChatId
          ? { ...chat, messages: updatedMessages }
          : chat
      )
    }));

    // Update chat title if it's the first message
    if (state.messages.length === 0) {
      updateChatTitle(state.currentChatId!, content);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: state.selectedModel,
          messages: updatedMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          stream: false,
        }),
      });

      const data = await response.json();
      const updatedMessagesWithResponse = [...updatedMessages, { 
        role: 'assistant', 
        content: data.message.content 
      }];

      setState(prev => ({
        ...prev,
        messages: updatedMessagesWithResponse,
        isLoading: false,
        chats: prev.chats.map(chat =>
          chat.id === prev.currentChatId
            ? { ...chat, messages: updatedMessagesWithResponse }
            : chat
        )
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to get response from the model',
      }));
    }
  };

  const handleClearChat = () => {
    if (state.currentChatId) {
      setState(prev => ({
        ...prev,
        messages: [],
        error: null,
        chats: prev.chats.filter(chat => chat.id !== prev.currentChatId),
        currentChatId: null,
      }));
    }
  };

  const handleModelChange = (model: string) => {
    setState(prev => ({ ...prev, selectedModel: model }));
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        chats={state.chats}
        currentChatId={state.currentChatId}
        onSelectChat={selectChat}
        onNewChat={createNewChat}
      />
      
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Ollama Chat</h1>
            <div className="flex items-center gap-4">
              <ModelSelector
                models={availableModels}
                selectedModel={state.selectedModel}
                onModelChange={handleModelChange}
              />
              <button
                onClick={handleClearChat}
                className="px-3 py-2 text-gray-600 hover:text-red-600 rounded-lg flex items-center gap-2"
              >
                <Trash2 size={20} />
                Clear Chat
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-white">
          {state.messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              {state.currentChatId ? 'Start a conversation by typing a message below' : 'Select a chat or start a new one'}
            </div>
          ) : (
            state.messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))
          )}
          {state.isLoading && (
            <div className="p-4 bg-gray-50">
              <div className="animate-pulse flex gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          )}
          {state.error && (
            <div className="p-4 bg-red-50 text-red-600 border-b border-red-100">
              {state.error}
            </div>
          )}
        </div>

        <ChatInput onSendMessage={handleSendMessage} disabled={state.isLoading} />
      </div>
    </div>
  );
}

export default App;