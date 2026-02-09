import { GoogleGenAI, Content, Part, Type } from "@google/genai";
import { Message, Scenario, ConversationStep, BotResponse } from "../types";
import { SYSTEM_INSTRUCTION_BASE } from "../constants";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not defined in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateBotResponse = async (
  currentMessage: string,
  history: Message[],
  scenario: Scenario,
  step: ConversationStep
): Promise<BotResponse> => {
  const ai = getClient();
  const modelId = "gemini-3-flash-preview"; // Using flash for speed, switch to pro if reasoning needs boost

  // Filter history to only include user and model (exclude guide messages from API history to avoid confusion, or keep them as context)
  // Let's keep them but treat 'guide' as 'model' for the API history perspective, but labeled clearly in text if needed.
  // Ideally, the model should know what the guide said.
  const contents: Content[] = history.map((msg) => ({
    role: msg.role === 'guide' ? 'model' : msg.role,
    parts: [{ text: msg.role === 'guide' ? `[SUPERVISOR NOTE]: ${msg.text}` : msg.text } as Part],
  }));

  if (currentMessage) {
    contents.push({
      role: "user",
      parts: [{ text: currentMessage } as Part],
    });
  } else if (contents.length === 0) {
    contents.push({
      role: "user",
      parts: [{ text: "Please look at the graph and tell me what you see." } as Part],
    });
  }

  // Enhanced System Instruction with Dual Persona and Evaluation Logic
  const specificInstruction = `
    You are the engine for an educational game called "GraphGullible".
    You must manage two distinct personas:
    
    1. **GraphGullible (The Student)**: A naive AI. 
       - Sees graphs superficially.
       - Falls for specific misleading features (defined in context).
       - Is friendly, curious, but easily tricked.
       - Only learns when the user points out the SPECIFIC visual flaw.
    
    2. **The Guide (The Supervisor)**: An expert data viz instructor.
       - Intervenes ONLY when the user fails to teach GraphGullible correctly.
       - Speaks directly to the user to correct them or give a hint.
       - Tone: Stern but helpful, like a teacher correcting a student's teaching method.

    CURRENT SCENARIO:
    Title: ${scenario.title}
    Description: ${scenario.description}
    Data: ${JSON.stringify(scenario.data)}
    MISLEADING FEATURE & AI CONTEXT: ${scenario.aiContext}

    CURRENT PROGRESS: Step ${step}
    (0=Bot Mistake, 1=User Corrects, 2=User Explains Feature, 3=User Fixes)

    YOUR TASK:
    Analyze the User's latest message.

    DECISION LOGIC:
    
    IF (Step == 0):
      - Ignore user input (it's just a trigger).
      - ACTION: Speak as **GraphGullible**. Interpret the graph WRONGLY based on the 'AI Context'. Be confident but wrong.
      - RESULT: Advance Step.

    IF (Step > 0):
      - Did the user agree with GraphGullible's wrong interpretation? -> FAIL.
      - Is the user talking about something completely unrelated? -> FAIL.
      - Did the user give a vague answer (e.g., "it's wrong" without saying why)? -> FAIL (if needing explanation).
      - Did the user correctly identify the issue or fix requested by the current Step? -> SUCCESS.

      CASE FAIL:
        - ACTION: Speak as **The Guide**.
        - Content: Point out why the user's teaching was insufficient. E.g., "Don't agree with the bot! The graph is misleading because..." or "You need to be more specific about the Y-axis."
        - RESULT: DO NOT Advance Step.

      CASE SUCCESS:
        - ACTION: Speak as **GraphGullible**.
        - Content: React naturally. 
          - If Step 1->2: "Oh? really? Why is it misleading?"
          - If Step 2->3: "I see the [feature] now! How do we fix it?"
          - If Step 3->4: "Aha! [Summary of lesson]. Thanks!"
        - RESULT: Advance Step.

    OUTPUT FORMAT:
    You MUST return JSON.
    {
      "sender": "model" (for GraphGullible) OR "guide" (for The Guide),
      "text": "The content of the message",
      "shouldAdvance": true (if success/GraphGullible) OR false (if fail/Guide)
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: contents,
      config: {
        systemInstruction: specificInstruction,
        responseMimeType: "application/json", // Force JSON for reliable parsing
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                sender: { type: Type.STRING, enum: ["model", "guide"] },
                text: { type: Type.STRING },
                shouldAdvance: { type: Type.BOOLEAN }
            }
        }
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response");
    
    const parsed = JSON.parse(jsonText) as BotResponse;
    return parsed;

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback in case of JSON error
    return {
        text: "I'm having a bit of trouble understanding. Can you say that again?",
        sender: "model",
        shouldAdvance: false
    };
  }
};