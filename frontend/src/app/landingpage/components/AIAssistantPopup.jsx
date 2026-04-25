"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../../../lib/api";
import GradualBlurMemo from "./Effects/GradualBlur";

const QUICK_SUGGESTIONS = [
  "What courses do you recommend for beginners?",
  "How can I become a full-stack developer?",
  "Tell me about your mentorship program",
  "What skills are in demand right now?",
];

const createInitialMessages = () => [
  {
    id: 1,
    type: "bot",
    content: "Hi! I'm your AI learning assistant. How can I help you today?",
    timestamp: new Date(),
  },
];

const AIAssistantPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(createInitialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  const resetChatState = () => {
    setMessages(createInitialMessages());
    setIsTyping(false);
    setIsLoading(false);
    setError(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleTouchStart = (e) => {
      // Store initial touch position
      container.dataset.touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      if (!container.dataset.touchStartY) return;

      const touchStartY = parseFloat(container.dataset.touchStartY);
      const touchCurrentY = e.touches[0].clientY;
      const deltaY = touchStartY - touchCurrentY;

      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      // If scrolling up and at top, or scrolling down and at bottom, prevent default
      if (
        (deltaY > 0 && scrollTop <= 0) ||
        (deltaY < 0 && scrollTop >= scrollHeight - clientHeight)
      ) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      delete container.dataset.touchStartY;
    };

    container.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen]);

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    setError(null);

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setIsTyping(true);
    setIsLoading(true);

    try {
      const response = await api("/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message }),
      });

      const botResponse = {
        id: Date.now() + 1,
        type: "bot",
        content: response.data.response,
        timestamp: new Date(response.data.timestamp),
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to connect to AI assistant. Please try again.");

      const errorResponse = {
        id: Date.now() + 1,
        type: "bot",
        content:
          "Sorry, I'm having trouble connecting right now. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const handleQuickSuggestion = (suggestion) => {
    handleSendMessage(suggestion);
  };

  const handleClose = () => {
    resetChatState();
    setIsOpen(false);
  };

  // Render message content with support for code blocks (```) and bordered highlights (**bold**)
  const renderMessageContent = (content, isBot = false) => {
    if (typeof content !== "string") return content;

    const nodes = [];
    let key = 0;

    const renderTextWithBreaks = (text) =>
      text
        .split("\n")
        .flatMap((line, i, arr) =>
          i === arr.length - 1
            ? [<span key={`t-${key++}`}>{line}</span>]
            : [
                <span key={`t-${key++}`}>{line}</span>,
                <br key={`br-${key++}`} />,
              ],
        );

    const boldRegex = /\*\*([\s\S]+?)\*\*/g;
    const codeRegex = /```(?:([\w-]+)\n)?([\s\S]*?)```/g;

    let lastIndex = 0;
    const m = codeRegex.exec(content);
    while (m !== null) {
      const before = content.slice(lastIndex, m.index);

      if (before) {
        let bLast = 0;
        const bMatch = boldRegex.exec(before);
        while (bMatch !== null) {
          const pre = before.slice(bLast, bMatch.index);
          if (pre) nodes.push(...renderTextWithBreaks(pre));
          const highlighted = bMatch[1];
          nodes.push(
            <span
              key={`h-${key++}`}
              className={`inline-block rounded px-2 py-1 mx-1 ${
                isBot ? "" : ""
              }`}
            >
              {highlighted}
            </span>,
          );
          bLast = bMatch.index + bMatch[0].length;
        }
        const tail = before.slice(bLast);
        if (tail) nodes.push(...renderTextWithBreaks(tail));
      }

      const codeBody = m[2] ?? m[1] ?? "";
      nodes.push(
        <pre
          key={`c-${key++}`}
          className="bg-[#767f8f]/[0.20] text-slate-100 font-mono rounded-md p-3 overflow-auto text-sm backdrop-blur-md mt-2"
          style={{ scrollbarWidth: "thin" }}
        >
          <code>{codeBody}</code>
        </pre>,
      );

      lastIndex = codeRegex.lastIndex;
    }

    const remaining = content.slice(lastIndex);
    if (remaining) {
      let bLast = 0;
      const bMatch = boldRegex.exec(remaining);
      while (bMatch !== null) {
        const pre = remaining.slice(bLast, bMatch.index);
        if (pre) nodes.push(...renderTextWithBreaks(pre));
        nodes.push(
          <span
            key={`h-${key++}`}
            className={`inline-block rounded font-bold ${isBot ? "" : ""}`}
          >
            {bMatch[1]}
          </span>,
        );
        bLast = bMatch.index + bMatch[0].length;
      }
      const tail = remaining.slice(bLast);
      if (tail) nodes.push(...renderTextWithBreaks(tail));
    }

    return <>{nodes}</>;
  };
  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full
          bg-gradient-to-br from-[#4e87e9]/[.50] to-[#894ee9]/[.15] backdrop-blur-md
          hover:bg-gradient-to-tr to-[#4e87e9]/[.70] from-[#894ee9]/[.15]
          shadow-[0_0_3px_rgba(255,255,255,0.5)]
          transition-all duration-500
          cursor-pointer
          flex items-center justify-center
          group
          ${isOpen ? "scale-0 rotate-180" : "scale-100"}
        `}
        aria-label="Open AI Assistant"
      >
        <svg
          className="w-6 h-6 text-white group-hover:scale-100 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <title>Open AI assistant</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed bottom-6 pointer-events-all backdrop-brightness-[0.7] shadow-[0_0_3px_rgba(255,255,255,0.5)] rounded-4xl bg-transparent backdrop-blur-md right-6 z-50 w-96 h-[500px] flex flex-col">
          <div className="p-4 shadow-[0_1px_0_0_rgba(255,255,255,0.3)] z-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#4e87e9]/[.30] to-[#894ee9]/[.15] backdrop-blur-md shadow-[0_0_3px_rgba(255,255,255,0.5)] rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <title>AI assistant</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">AI Assistant</h3>
                  <p className="text-slate-400 text-sm">
                    Online and Ready to help
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-slate-400 cursor-pointer hover:text-white transition-colors p-1"
                aria-label="Close chat"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>Close chat</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* <GradualBlurMemo
            position="top"
            target="page"
          /> */}

          <div
            ref={messagesContainerRef}
            className="chat-scroll-container backdrop-blur-lg p-4 overflow-y-auto scroll-smooth flex-1 min-h-auto"
            style={{ WebkitOverflowScrolling: "touch" }}
            data-lenis-prevent
          >
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  {/* <div
                    className={`
                        max-w-[80%] p-3 rounded-2xl
                        ${
                          message.type === "user"
                            ? "bg-gradient-to-r from-[#3378f0]/[.15] to-[#8233f0]/[.10] shadow-[0_0_5px_-3px_rgba(255,255,255,0.5)] backdrop-blur-md text-white"
                            : "bg-[#767f8f23] backdrop-blur-lg backdrop-brightness-[0] text-slate-200 shadow-[0_0_3px_rgba(255,255,255,0.7)]"
                        }
                    `}
                  > */}
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl border border-white/20 shadow-xl transition-all ${
                      message.type === "user"
                        ? "bg-white/10 backdrop-blur-md text-white"
                        : "bg-black/10 backdrop-blur-lg text-slate-200"
                    }`}
                  >
                    {message.type === "bot" ? (
                      <div className="text-sm leading-relaxed">
                        {renderMessageContent(message.content, true)}
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    )}
                    <p
                      className={`text-xs mt-1 ${message.type === "user" ? "text-blue-100" : "text-slate-500"}`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="backdrop-blur-lg p-3 rounded-2xl border border-slate-700">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {messages.length === 1 && !isTyping && (
            <div className="backdrop-blur-xl p-3">
              <p className="text-slate-100 text-xs mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() =>
                      !isLoading && handleQuickSuggestion(suggestion)
                    }
                    disabled={isLoading}
                    className="text-xs cursor-pointer bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-300 px-3 py-1 rounded-full transition-colors border border-slate-600 disabled:border-slate-700 disabled:cursor-not-allowed"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-b-2xl p-4">
            {error && (
              <div className="mb-2 p-2 bg-red-900/20 border border-red-700 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Type your message..."
                className="flex-1 bg-slate-800 border border-slate-600 rounded-full px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !isLoading) {
                    handleSendMessage(e.target.value);
                    e.target.value = "";
                  }
                }}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => {
                  if (inputRef.current?.value && !isLoading) {
                    handleSendMessage(inputRef.current.value);
                    inputRef.current.value = "";
                  }
                }}
                disabled={isLoading}
                className="w-10 h-10 cursor-pointer bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                aria-label="Send message"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <title>Send message</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistantPopup;
