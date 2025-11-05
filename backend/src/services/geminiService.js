import { GoogleGenerativeAI } from "@google/generative-ai";

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash", // Updated model name
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    });
  }

  async getChatCompletion(messages, options = {}) {
    try {
      const systemPrompt =
        messages.find((m) => m.role === "system")?.content || "";
      const conversationHistory = messages.filter((m) => m.role !== "system");

      const cleanHistory = this.convertToGeminiHistory(conversationHistory);
      const validHistory = cleanHistory.slice(0, -1); // remove only if >1 messages

      const chat = this.model.startChat({
        history: validHistory.length ? validHistory : [],
        generationConfig: options.generationConfig || {},
      });

      const lastMessage =
        conversationHistory[conversationHistory.length - 1].content;

      const promptWithContext = systemPrompt
        ? `${systemPrompt}\n\nUser: ${lastMessage}`
        : lastMessage;

      const result = await chat.sendMessage(promptWithContext);
      const response = result.response;

      return {
        role: "assistant",
        content: response.text(),
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error("Failed to get AI response");
    }
  }

  async getChatCompletionWithFunctions(messages, functions) {
    try {
      // ✅ Extract system prompt but do NOT include it as a role in the history
      const systemPrompt =
        messages.find((m) => m.role === "system")?.content || "";
      const conversationHistory = messages.filter((m) => m.role !== "system");

      const functionsPrompt = this.buildFunctionsPrompt(functions);

      // ✅ Combine system + function + conversation into one single text prompt
      const conversationText = conversationHistory
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");

      const fullPrompt = `${systemPrompt}\n\n${functionsPrompt}\n\nConversation:\n${conversationText}`;

      // ✅ Send as one text input from the "user"
      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      });

      const response = result.response;
      const text = response.text();

      const functionCall = this.extractFunctionCall(text);

      if (functionCall) {
        return {
          role: "assistant",
          content: text,
          function_call: functionCall,
        };
      }

      return {
        role: "assistant",
        content: text,
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error("Failed to get AI response with functions");
    }
  }

  convertToGeminiHistory(messages) {
    // Ensure history starts with user role
    const filtered = messages.filter(
      (msg) => msg.role === "user" || msg.role === "assistant"
    );

    // If first message isn't from user, drop assistant messages at the start
    while (filtered.length && filtered[0].role === "assistant") {
      filtered.shift();
    }

    return filtered.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));
  }

  buildFunctionsPrompt(functions) {
    const functionsDesc = functions
      .map(
        (f) =>
          `Function: ${f.name}\nDescription: ${
            f.description
          }\nParameters: ${JSON.stringify(f.parameters, null, 2)}`
      )
      .join("\n\n");

    return `You have access to these functions. When you need to use one, respond with JSON in this format:
{
  "function_call": {
    "name": "function_name",
    "arguments": {"param": "value"}
  },
  "explanation": "Why you're calling this function"
}

Available functions:
${functionsDesc}`;
  }

  extractFunctionCall(text) {
    const jsonMatch = text.match(/\{[\s\S]*"function_call"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.function_call;
      } catch {
        return null;
      }
    }
    return null;
  }

  async streamChatCompletion(messages, onChunk, options = {}) {
    try {
      const systemPrompt =
        messages.find((m) => m.role === "system")?.content || "";
      const conversationHistory = messages.filter((m) => m.role !== "system");

      const chat = this.model.startChat({
        history: this.convertToGeminiHistory(conversationHistory.slice(0, -1)),
      });

      const lastMessage =
        conversationHistory[conversationHistory.length - 1].content;
      const promptWithContext = systemPrompt
        ? `${systemPrompt}\n\nUser: ${lastMessage}`
        : lastMessage;

      const result = await chat.sendMessageStream(promptWithContext);

      let fullResponse = "";
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
        onChunk(chunkText);
      }

      return fullResponse;
    } catch (error) {
      console.error("Gemini Streaming Error:", error);
      throw new Error("Failed to stream AI response");
    }
  }
}

const geminiService = new GeminiService();
export default geminiService;
