import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

const App = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI Teaching Assistant. How can I help you today?",
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  // Auto-scroll to the bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

const handleSendMessage = async () => {
  if (!newMessage.trim()) return;

  const userMessage = {
    id: messages.length + 1,
    text: newMessage,
    sender: 'user',
    timestamp: new Date(),
  };

  setMessages((prev) => [...prev, userMessage]);
  setNewMessage('');
  setIsTyping(true);

  try {
    const response = await fetch('http://localhost:3000/ask-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: newMessage,
        conversationHistory: messages.map((msg) => ({
          role: msg.sender,
          content: msg.text,
        }))
      }),
    });

    const data = await response.json();

    const aiMessage = {
      id: messages.length + 2,
      text: data.aiResponse || "AI failed to respond.",
      sender: 'ai',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiMessage]);
  } catch (error) {
    console.error('Error:', error);
    setMessages((prev) => [...prev, { 
      id: messages.length + 2, 
      text: "Error communicating with server.", 
      sender: 'ai', 
      timestamp: new Date() 
    }]);
  } finally {
    setIsTyping(false);
  }
};


  return (
    <div className="flex flex-col h-screen bg-[#1A1B2E]">
      {/* Header */}
      <div className="h-16 bg-[#1A1B2E]/80 backdrop-blur-lg border-b border-[#2A2B3E] flex items-center px-6">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <img 
              src="https://public.readdy.ai/ai/img_res/5a180b14fc6d8ce3b0bfc8b6207e3731.jpg" 
              alt="AI Assistant" 
            />
          </Avatar>
          <h1 className="text-white text-lg font-semibold">AI Teaching Assistant</h1>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <ScrollArea
          className="flex-1 px-6 py-4 bg-[#1A1B2E] overflow-y-auto max-h-[calc(100vh-8rem)]"
          ref={scrollRef}
        >
          <div className="space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="flex items-start gap-3 max-w-[70%]">
                  <Avatar className="h-9 w-9">
                    <img
                      src={message.sender === 'user' ? 
                        "https://public.readdy.ai/ai/img_res/edce80db4e0a94adc78d8ec91e361b8f.jpg" : 
                        "https://public.readdy.ai/ai/img_res/afefe17f8c3c3db0d9c3fe13973d938f.jpg"}
                      alt={message.sender}
                    />
                  </Avatar>
                  <div className={`rounded-xl p-4 ${message.sender === 'user' ? 'bg-[#7B5FF5] text-white' : 'bg-[#2A2B3E] text-gray-100'}`}>
                    <p className="text-sm whitespace-pre-line">{message.text}</p>
                    <p className="text-xs mt-2 opacity-70">{message.timestamp.toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-2 text-gray-400">
                <div className="animate-pulse">AI is thinking...</div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Error Message */}
        {error && (
          <div className="p-2 bg-red-500 text-white text-sm text-center">
            {error}
          </div>
        )}

        {/* Input Field */}
        <div className="border-t border-[#2A2B3E] bg-[#1A1B2E] p-4 sticky bottom-0">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="bg-[#2A2B3E] border-none text-white placeholder-gray-400 pr-12"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isTyping}
              />
              <Button
                className="!rounded-button absolute right-2 top-1/2 -translate-y-1/2 bg-[#7B5FF5] hover:bg-[#6B4FE5] h-8 w-8 p-0"
                onClick={handleSendMessage}
                disabled={isTyping}
              >
                {isTyping ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <i className="fas fa-paper-plane text-sm"></i>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
