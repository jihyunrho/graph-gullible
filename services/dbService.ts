
import { Message } from '../types';

export const saveChatSession = async (
  sessionId: string,
  email: string,
  scenarioId: number,
  title: string,
  messages: Message[]
) => {
  // We now include session_id in the payload to allow UPSERT (update if exists)
  const payload = {
    session_id: sessionId,
    user_email: email,
    scenario_id: scenarioId,
    scenario_title: title,
    messages: messages 
  };

  try {
    const response = await fetch('/api/save-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        if (response.status === 404) {
             console.error("API Endpoint not found. Are you running 'vercel dev'?");
        }
        const errText = await response.text();
        throw new Error(`Server error (${response.status}): ${errText}`);
    }
    
  } catch (error) {
    console.error("DB Save Failed:", error);
  }
};

export const saveUserGroup = async (email: string, group: string) => {
    try {
        const response = await fetch('/api/save-user-group', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, group })
        });

        if (!response.ok) {
             const errText = await response.text();
             console.error("Failed to save user group:", errText);
        }
    } catch (error) {
        console.error("DB Group Save Failed:", error);
    }
};
