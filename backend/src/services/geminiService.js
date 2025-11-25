import { GoogleGenerativeAI } from "@google/generative-ai";

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    });

    // Retry configuration
    this.maxRetries = 3;
    this.baseDelay = 1000; // 1 second
  }

  // Exponential backoff retry wrapper
  async retryWithBackoff(fn, retries = this.maxRetries) {
    let lastError;

    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Check if it's a retryable error (503, 429, or network errors)
        const isRetryable =
          error.status === 503 ||
          error.status === 429 ||
          error.status === 500 ||
          error.message.includes("overloaded") ||
          error.message.includes("ECONNRESET");

        if (!isRetryable) {
          console.error("❌ Non-retryable error:", error.message);
          throw error;
        }

        if (i === retries - 1) {
          console.error(`❌ All ${retries} retry attempts failed`);
          throw error;
        }

        // Calculate delay with exponential backoff + jitter
        const delay = this.baseDelay * Math.pow(2, i) + Math.random() * 1000;
        console.warn(
          `⚠️  API overloaded. Retry ${i + 1}/${retries} in ${Math.round(
            delay
          )}ms... (${error.status})`
        );
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getChatCompletion(messages, options = {}) {
    return this.retryWithBackoff(async () => {
      const systemPrompt =
        messages.find((m) => m.role === "system")?.content || "";
      const conversationHistory = messages.filter((m) => m.role !== "system");

      const cleanHistory = this.convertToGeminiHistory(conversationHistory);
      const validHistory = cleanHistory.slice(0, -1);

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
    });
  }

  async getChatCompletionWithFunctions(messages, functions) {
    return this.retryWithBackoff(async () => {
      const systemPrompt =
        messages.find((m) => m.role === "system")?.content || "";
      const conversationHistory = messages.filter((m) => m.role !== "system");

      const functionsPrompt = this.buildFunctionsPrompt(functions);

      const conversationText = conversationHistory
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");

      const fullPrompt = `${systemPrompt}\n\n${functionsPrompt}\n\nConversation:\n${conversationText}`;

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
    });
  }

  convertToGeminiHistory(messages) {
    const filtered = messages.filter(
      (msg) => msg.role === "user" || msg.role === "assistant"
    );

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
    return this.retryWithBackoff(async () => {
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
    });
  }
}

const geminiService = new GeminiService();
export default geminiService;
