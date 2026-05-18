"use client";

import { useState } from "react";
import Card from "@/app/components/ui/Card";
import TopBar from "../components/layout/TopBar/TopBar";

const AICompanionPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "ai",
      content: "Hello! I'm your AI Study Companion. I can help you with doubt resolution, summarization, and learning guidance. What would you like to know today?",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      type: "user",
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages([...messages, newMessage]);
    setInputMessage("");

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        type: "ai",
        content: "That's a great question! Let me help you understand this concept. " + getAIResponse(inputMessage),
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const getAIResponse = (question) => {
    // Simple mock responses - in real app, this would call an AI API
    if (question.toLowerCase().includes("react")) {
      return "React is a JavaScript library for building user interfaces. Key concepts include components, props, state, and the virtual DOM.";
    }
    if (question.toLowerCase().includes("algorithm")) {
      return "Algorithms are step-by-step procedures for solving problems. Focus on understanding time complexity (Big O notation) and common patterns like divide and conquer.";
    }
    return "I'm here to help! Could you provide more details about what you're studying or what specific question you have?";
  };

  const quickQuestions = [
    "Explain React hooks",
    "Help with sorting algorithms",
    "Summarize machine learning basics",
    "Debug my JavaScript code",
  ];

  return (
    <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
      <TopBar
        title="AI Study Companion"
        subtitle="24/7 conversational tutor for instant doubt resolution and summarization"
      />

      <div className="grid gap-5 lg:grid-cols-4">
        {/* Chat Interface */}
        <div className="lg:col-span-4">
          <Card
            className="border h-[600px] flex justify-between"
            style={{
              borderColor: "var(--dashboard-border)",
              backgroundColor: "var(--dashboard-surface)",
            }}
          >
            <div className="flex flex-col">
              {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.type === "user"
                        ? "rounded-br-none"
                        : "rounded-bl-none"
                    }`}
                    style={{
                      backgroundColor: message.type === "user"
                        ? "var(--dashboard-primary)"
                        : "color-mix(in srgb, var(--dashboard-surface) 90%, var(--dashboard-primary) 10%)",
                      color: message.type === "user"
                        ? "var(--dashboard-primary-fg)"
                        : "var(--dashboard-fg)",
                    }}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">{message.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="border-t p-4" style={{ borderColor: "var(--dashboard-border)" }}>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask me anything about your studies..."
                  className="flex-1 px-3 py-2 rounded-md border"
                  style={{
                    borderColor: "var(--dashboard-border)",
                    backgroundColor: "var(--dashboard-surface)",
                    color: "var(--dashboard-fg)",
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  className="px-4 py-2 rounded-md font-medium"
                  style={{
                    backgroundColor: "var(--dashboard-primary)",
                    color: "var(--dashboard-primary-fg)",
                  }}
                >
                  Send
                </button>
              </div>
            </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
          {/* Quick Questions */}
          {/* <Card
            className="border"
            style={{
              borderColor: "var(--dashboard-border)",
              backgroundColor: "var(--dashboard-surface)",
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--dashboard-fg)" }}>
              Quick Questions
            </h3>
            <div className="space-y-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(question)}
                  className="w-full text-left p-3 rounded-lg border hover:shadow-sm transition-all"
                  style={{
                    borderColor: "var(--dashboard-border)",
                    backgroundColor: "color-mix(in srgb, var(--dashboard-surface) 95%, var(--dashboard-primary) 5%)",
                    color: "var(--dashboard-fg)",
                  }}
                >
                  <p className="text-sm">{question}</p>
                </button>
              ))}
            </div>
          </Card> */}

          {/* AI Capabilities */}
          <Card
            className="border"
            style={{
              borderColor: "var(--dashboard-border)",
              backgroundColor: "var(--dashboard-surface)",
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--dashboard-fg)" }}>
              AI Capabilities
            </h3>
            <ul className="text-sm space-y-2" style={{ color: "var(--dashboard-muted)" }}>
              <li>Instant doubt resolution</li>
              <li>Concept summarization</li>
              <li>Code explanation</li>
              <li>Study planning</li>
              <li>Quiz generation</li>
              <li>Progress tracking</li>
            </ul>
          </Card>

          {/* Study Stats */}
          <Card
            className="border"
            style={{
              borderColor: "var(--dashboard-border)",
              backgroundColor: "var(--dashboard-surface)",
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--dashboard-fg)" }}>
              This Session
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "var(--dashboard-muted)" }}>Questions Asked:</span>
                <span style={{ color: "var(--dashboard-fg)" }}>3</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--dashboard-muted)" }}>Topics Covered:</span>
                <span style={{ color: "var(--dashboard-fg)" }}>React, Algorithms</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--dashboard-muted)" }}>Study Time:</span>
                <span style={{ color: "var(--dashboard-fg)" }}>25 min</span>
              </div>
            </div>
          </Card>
        </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AICompanionPage;