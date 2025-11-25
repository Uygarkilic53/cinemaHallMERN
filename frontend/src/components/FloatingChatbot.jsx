import React, { useState, useRef, useEffect } from "react";
import api from "../services/api";
import {
  FaUser,
  FaRobot,
  FaPaperPlane,
  FaTimes,
  FaComments,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "👋 Hi! I'm CinemaAI — your movie and site assistant. Ask me about movies, reservations, or how to use the site!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom when new messages appear
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/ai/chat", {
        message: input,
        history: messages,
      });

      const reply = res.data.reply || "⚠️ Sorry, I couldn't get a response.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "❌ Something went wrong connecting to CinemaAI.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Toggle chat"
      >
        {isOpen ? <FaTimes size={24} /> : <FaComments size={24} />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-40 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <FaRobot className="text-2xl" />
                <h2 className="text-lg font-semibold">CinemaAI Assistant</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-blue-800 p-1 rounded-full transition"
                aria-label="Close chat"
              >
                <FaTimes size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gradient-to-b from-gray-50 to-gray-100">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-start gap-2 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="bg-blue-500 text-white p-2 rounded-full flex-shrink-0">
                      <FaRobot size={16} />
                    </div>
                  )}

                  <div
                    className={`p-3 rounded-2xl max-w-[75%] leading-relaxed text-sm ${
                      msg.role === "assistant"
                        ? "bg-blue-100 text-gray-800 rounded-bl-none"
                        : "bg-green-100 text-gray-800 rounded-br-none"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {msg.role === "user" && (
                    <div className="bg-green-500 text-white p-2 rounded-full flex-shrink-0">
                      <FaUser size={16} />
                    </div>
                  )}
                </motion.div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-gray-500 italic text-sm">
                  <FaRobot className="animate-bounce" />
                  <span>CinemaAI is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 p-4 border-t bg-white rounded-b-2xl">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none text-gray-800"
                placeholder="Ask about movies or site help..."
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition disabled:opacity-50 flex-shrink-0"
                aria-label="Send message"
              >
                <FaPaperPlane size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
