import { GoogleGenAI, Content, Part, Type } from "@google/genai";
import { Message, Scenario, ConversationStep, BotResponse } from "../types";

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
  step: ConversationStep,
  mistakeCount: number = 0,
  isTutorialMode: boolean = false
): Promise<BotResponse> => {
  const ai = getClient();
  const modelId = "gemini-2.5-flash-lite";

  // Guide is disabled in tutorial mode
  const allowGuideIntervention = !isTutorialMode;

  const contents: Content[] = history.map((msg) => ({
    role: msg.role === 'guide' ? 'model' : msg.role,
    parts: [{ text: msg.role === 'guide' ? `[PREVIOUS SUPERVISOR INTERVENTION]: ${msg.text}` : msg.text } as Part],
  }));

  if (currentMessage) {
    contents.push({
      role: "user",
      parts: [{ text: currentMessage } as Part],
    });
  } else if (contents.length === 0) {
    contents.push({
      role: "user",
      parts: [{ text: "Start the simulation. Look at the graph." } as Part],
    });
  }

  // Logic to provide hints or direct answers if user is struggling (only if guide allowed)
  const isStruggling = mistakeCount >= 2;
  const guidanceInstruction = (allowGuideIntervention && isStruggling)
    ? `IMPORTANT: The user has failed to explain this correctly ${mistakeCount} times. STOP BEING VAGUE. As the 'guide', you must explicitly TELL the user the answer or the exact keyword they need to type. Do not just hint. Give the solution. Keep it under 35 words.` 
    : "";

  // Dynamic instruction based on mode to prevent hallucinations
  const userCorrectsFailureBehavior = allowGuideIntervention
    ? `Return sender="guide". Text: "The bot is misinterpreting the graph. You need to explicitly tell it that it is wrong."`
    : `Act confident in your wrong belief. Text: "I'm pretty sure I'm right! Look at the graph! Why would I be wrong?". sender: "model".`;

  let stepInstruction = "";
  switch(step) {
    case ConversationStep.INIT_MISLED: // Step 0
      stepInstruction = `
        TASK: Act as the Naive "Model".
        ACTION: Look at the graph and make a confidently WRONG interpretation based strictly on the TRICK defined below.
        CONSTRAINT: Be happy about the wrong conclusion.
        RESULT: shouldAdvance = true.
      `;
      break;
    
    case ConversationStep.USER_CORRECTS: // Step 1
      stepInstruction = `
        CONTEXT: You just made a misleading claim. The user IS EXPECTED to correct you now.
        
        CHECK USER INPUT:
        1. Does the user explicitly say you are wrong, misled, incorrect, or that the graph is deceptive?
        2. Does the user disagree with your conclusion?
        
        IF YES (User Corrects):
           - TASK: React to the user saying you are wrong.
           - ACTION: Act surprised. Apologize.
           - CRITICAL: Ask "What specifically tricked me?" or "Which part should I look at?".
           - CONSTRAINT: Play dumb. Do NOT correct yourself yet.
           - RESULT: shouldAdvance = true.
           - sender: "model"
           
        IF NO (User Agrees, changes topic, or is vague):
           - ${userCorrectsFailureBehavior}
           - RESULT: shouldAdvance = false.
      `;
      break;

    case ConversationStep.USER_EXPLAINS_FEATURE: // Step 2
      stepInstruction = `
        TASK: User pointed out the visual feature.
        ACTION: Acknowledge the feature.
        CRITICAL: Act confused about the MEANING. Ask: "I see that, but how does that make my interpretation wrong?"
        CONSTRAINT: Do NOT correct your interpretation yet.
        RESULT: shouldAdvance = true.
      `;
      break;

    case ConversationStep.USER_SUGGESTS_FIX: // Step 3
      stepInstruction = `
        TASK: User explained the impact.
        ACTION: Have an "Aha!" moment.
        CRITICAL: Thank the user and restate the correct interpretation.
        RESULT: shouldAdvance = true.
      `;
      break;

    default: // Step 4 or others
      stepInstruction = "The conversation is complete. Thank the user.";
  }

  // STRICT ENUM CONSTRAINT:
  // In Tutorial Mode, strictly remove 'guide' from the allowed values.
  // This physically prevents the model from generating a guide response.
  const validSenders = allowGuideIntervention ? ["model", "guide"] : ["model"];

  const specificInstruction = `
    Role: Game Engine for "GraphGullible".
    
    SCENARIO: ${scenario.title}.
    TRICK: ${scenario.aiContext}
    
    CURRENT CONVERSATION STEP ID: ${step}
    
    ${stepInstruction}
    ${guidanceInstruction}
    
    GLOBAL RULES:
    1. MODE: ${isTutorialMode ? "TUTORIAL (NO GUIDE ALLOWED)" : "TRAINING (GUIDE ENABLED)"}.
    2. If Tutorial Mode, sender MUST be "model".
    3. If Training Mode and user fails to correct the bot in Step 1, sender MUST be "guide".

    LATENCY & STYLE RULES:
    1. KEEP IT SHORT. Maximum 2 sentences.
    2. Maximum 35 words total.
    3. Be snappy and naive.

    IMPORTANT: Return RAW JSON only.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: contents,
      config: {
        systemInstruction: specificInstruction,
        responseMimeType: "application/json",
        maxOutputTokens: 400,
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                sender: { type: Type.STRING, enum: validSenders }, // <--- STRICT CONSTRAINT
                text: { type: Type.STRING },
                shouldAdvance: { type: Type.BOOLEAN }
            }
        }
      },
    });

    let jsonText = response.text;
    if (!jsonText) throw new Error("Empty response");
    
    jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");

    const parsed = JSON.parse(jsonText) as BotResponse;
    return parsed;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
        text: "I'm having a little trouble thinking straight. Can you click that Retry button?",
        sender: "model",
        shouldAdvance: false
    };
  }
};