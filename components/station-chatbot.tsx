'use client';

import React from "react"

import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
import { getStationById } from '@/lib/dummy-data';

interface StationChatbotProps {
  stationId: string;
  stationName: string;
}

// Dummy AI responses based on user queries
const getDummyChatResponse = (message: string, station: any): string => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('battery') || lowerMessage.includes('available')) {
    return `We currently have ${station.inventory.charged} charged batteries available at ${station.name}. Total capacity is ${station.inventory.total_slots} slots.`;
  }
  if (lowerMessage.includes('wait') || lowerMessage.includes('queue')) {
    return `Current queue length is ${station.queue.length} people. Average wait time is approximately ${station.queue.avg_wait_time_min} minutes.`;
  }
  if (lowerMessage.includes('charger') || lowerMessage.includes('status')) {
    const workingChargers = station.chargers.filter((c: any) => c.status === 'OK').length;
    return `We have ${workingChargers} out of ${station.chargers.length} chargers operating normally.`;
  }
  if (lowerMessage.includes('hour') || lowerMessage.includes('busy')) {
    return `This time of day is typically moderately busy. We're seeing steady flow with manageable wait times.`;
  }
  if (lowerMessage.includes('help') || lowerMessage.includes('?')) {
    return `I can help you with: battery availability, current queue status, charger information, and wait time estimates. What would you like to know?`;
  }
  return `Thanks for your question! Based on current data, ${station.name} is operating normally with ${station.inventory.charged} batteries available. Is there anything specific you'd like to know?`;
};

export function StationChatbot({ stationId, stationName }: StationChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hi! I'm the SwapHub assistant for ${stationName}. Ask me anything about battery availability, wait times, or station information.`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      // Simulate API call with dummy data
      await new Promise((resolve) => setTimeout(resolve, 600));

      const station = getStationById(stationId);
      const responseText = station ? getDummyChatResponse(inputValue, station) : 'I\'m unable to retrieve station information at the moment.';

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('[v0] Chat error:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                msg.role === 'user'
                  ? 'bg-accent text-white rounded-br-none'
                  : 'bg-white text-foreground border border-border rounded-bl-none'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-border px-4 py-2 rounded-lg text-sm text-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t p-4 bg-white flex gap-2">
        <Input
          type="text"
          placeholder="Ask about battery status..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={loading}
          className="flex-1 text-sm"
        />
        <Button
          type="submit"
          disabled={loading || !inputValue.trim()}
          size="sm"
          className="bg-accent hover:bg-orange-600 text-white px-3"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
