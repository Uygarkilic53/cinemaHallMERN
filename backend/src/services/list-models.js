// list-models.js
// lists available models for your API key
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyD90FSnzevfnnjUX1cBIyBnNbQ6NNv1TVw";
const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
  try {
    console.log("Fetching available models...\n");

    // Try to list models
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log("✅ Available models for your API key:\n");

    if (data.models && data.models.length > 0) {
      data.models.forEach((model) => {
        console.log(`📦 ${model.name}`);
        console.log(`   Display Name: ${model.displayName}`);
        console.log(
          `   Supports generateContent: ${
            model.supportedGenerationMethods?.includes("generateContent")
              ? "✅ YES"
              : "❌ NO"
          }`
        );
        console.log("");
      });
    } else {
      console.log("No models found!");
    }
  } catch (error) {
    console.error("❌ Error listing models:", error.message);
  }
}

listModels();
