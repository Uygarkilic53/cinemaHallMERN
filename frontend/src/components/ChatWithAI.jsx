import React, { useState, useRef, useEffect } from "react";
import api from "../services/api";
import { FaUser, FaRobot, FaPaperPlane } from "react-icons/fa";
import { motion } from "framer-motion";

export default function ChatWithAI() {
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

      const reply = res.data.reply || "⚠️ Sorry, I couldn’t get a response.";
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

  return (
    <div className="flex flex-col h-[90vh] max-w-2xl mx-auto p-4 border border-gray-300 rounded-2xl bg-gradient-to-b from-gray-50 to-gray-100 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 border-b pb-3 mb-3">
        <FaRobot className="text-blue-600 text-2xl" />
        <h2 className="text-xl font-semibold text-gray-800">
          CinemaAI Assistant
        </h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 px-2">
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
              <div className="bg-blue-500 text-white p-2 rounded-full">
                <FaRobot />
              </div>
            )}

            <div
              className={`p-3 rounded-2xl max-w-[75%] leading-relaxed ${
                msg.role === "assistant"
                  ? "bg-blue-100 text-gray-800 rounded-bl-none"
                  : "bg-green-100 text-gray-800 rounded-br-none"
              }`}
            >
              {msg.content}
            </div>

            {msg.role === "user" && (
              <div className="bg-green-500 text-white p-2 rounded-full">
                <FaUser />
              </div>
            )}
          </motion.div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-gray-500 italic">
            <FaRobot className="animate-bounce" />
            <span>CinemaAI is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="flex items-center gap-2 mt-3 border-t pt-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none text-gray-800"
          placeholder="Ask about movies or site help..."
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition disabled:opacity-50"
        >
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
}
