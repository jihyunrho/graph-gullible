import { Message } from '../types';

export const saveChatSession = async (
  email: string,
  scenarioId: number,
  title: string,
  messages: Message[]
) => {
  const payload = {
    email,
    scenarioId,
    scenarioTitle: title,
    messages,
    timestamp: new Date().toISOString()
  };

  try {
    // Call the Vercel Serverless Function
    const response = await fetch('/api/save-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
    }
    
    const result = await response.json();
    console.log("Session saved successfully:", result);
    
  } catch (error) {
    // We log the error but don't disrupt the user flow
    console.error("Failed to save chat session to DB:", error);
    
    // Fallback log for debugging
    console.log("Fallback Payload Log:", payload);
  }
};