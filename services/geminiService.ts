import { GoogleGenAI } from "@google/genai";
import { SimulationParams, SimulationStep } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const askGemini = async (
  question: string,
  params: SimulationParams,
  currentStep: SimulationStep,
  history: { role: string; parts: { text: string }[] }[]
): Promise<string> => {
  try {
    const model = 'gemini-3-flash-preview';
    
    const context = `
      You are an expert physics tutor specializing in Special Relativity.
      The user is interacting with a visualization of the Twin Paradox.
      
      Current Simulation Parameters:
      - Distance to star: ${params.distance} light years.
      - Velocity of Alice (traveler): ${params.velocity}c.
      - Current Stage: ${currentStep}.
      
      Calculated Values:
      - Gamma Factor: ${1 / Math.sqrt(1 - Math.pow(params.velocity, 2))}
      
      Explain concepts simply but accurately. Focus on Time Dilation, Relativity of Simultaneity, and Minkowski Diagrams.
      Keep answers concise (under 150 words) unless asked for deep detail.
    `;

    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: context,
      },
      history: history.map(h => ({
        role: h.role,
        parts: h.parts
      }))
    });

    const result = await chat.sendMessage({ message: question });
    return result.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error communicating with the AI physics tutor.";
  }
};
