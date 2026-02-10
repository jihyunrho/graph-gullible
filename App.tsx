import React, { useState, useEffect, useCallback, useRef } from 'react';
import GraphDisplay from './components/GraphDisplay';
import ChatInterface from './components/ChatInterface';
import OverlayScreen from './components/OverlayScreen';
import EmailScreen from './components/EmailScreen';
import { SCENARIOS } from './constants';
import { generateBotResponse } from './services/geminiService';
import { saveChatSession } from './services/dbService';
import { Message, ConversationStep } from './types';
import { BarChart3, GraduationCap, Target } from 'lucide-react';

const App: React.FC = () => {
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<ConversationStep>(ConversationStep.INIT_MISLED);
  const [isLoading, setIsLoading] = useState(false);
  const [mistakeCount, setMistakeCount] = useState(0);
  
  // Track the unique session ID for the current scenario run
  const [sessionId, setSessionId] = useState<string>('');
  
  // Ref to hold the current session ID to access it inside closures without dependency issues
  const sessionIdRef = useRef<string>('');

  // Ref to track the latest request ID to ignore stale responses
  const activeRequestId = useRef(0);
  
  // App Flow State
  const [userEmail, setUserEmail] = useState('');
  const [showEmailEntry, setShowEmailEntry] = useState(true);
  const [showIntro, setShowIntro] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [showEnding, setShowEnding] = useState(false);

  const currentScenario = SCENARIOS[currentScenarioIndex];
  const isTutorial = currentScenario.isTutorial === true;
  const isUserTurn = !isLoading && step !== ConversationStep.COMPLETED && step !== ConversationStep.INIT_MISLED;

  // Determine if we should show tutorial options
  const currentTutorialConfig = isTutorial && isUserTurn ? currentScenario.tutorialSteps?.[step] : undefined;

  // Calculate stats for progress bar
  const totalScenarios = SCENARIOS.length;
  const tutorialCount = SCENARIOS.filter(s => s.isTutorial).length;
  const mainCount = totalScenarios - tutorialCount;
  
  const isMainGame = !isTutorial;
  const mainGameProgress = isMainGame ? (currentScenarioIndex - tutorialCount) : -1;

  // Helper to generate UUID
  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  // Helper to safely update session ID state and ref
  const updateSessionId = (id: string) => {
    setSessionId(id);
    sessionIdRef.current = id;
  };

  // Shared Logic for processing bot interaction
  const processBotInteraction = async (userText: string, currentHistory: Message[], activeSessionId: string) => {
    const requestId = ++activeRequestId.current;
    setIsLoading(true);

    // Determine what the NEXT step *would* be if successful
    let potentialNextStep = step;
    if (step === ConversationStep.USER_CORRECTS) potentialNextStep = ConversationStep.USER_EXPLAINS_FEATURE;
    else if (step === ConversationStep.USER_EXPLAINS_FEATURE) potentialNextStep = ConversationStep.USER_SUGGESTS_FIX;
    else if (step === ConversationStep.USER_SUGGESTS_FIX) potentialNextStep = ConversationStep.COMPLETED;

    try {
      const response = await generateBotResponse(
        userText,
        currentHistory,
        currentScenario,
        step,
        mistakeCount,
        isTutorial // Pass isTutorialMode
      );

      // CRITICAL: Check if this response corresponds to the latest request
      if (activeRequestId.current !== requestId) {
        return; // Ignore stale response
      }

      const finalMessages = [...currentHistory, { role: response.sender, text: response.text } as Message];
      setMessages(finalMessages);

      if (response.shouldAdvance) {
        setStep(potentialNextStep);
        setMistakeCount(0); // Reset mistakes on success
      } else if (response.sender === 'guide') {
        setMistakeCount(prev => prev + 1); // Increment mistakes if guide intervenes
      }

      // AUTO-SAVE (Real-time: Bot Response)
      if (userEmail && activeSessionId) {
        void saveChatSession(activeSessionId, userEmail, currentScenario.id, currentScenario.title, finalMessages);
      }

    } catch (error) {
      if (activeRequestId.current === requestId) {
         console.error("Error generating response", error);
         setMessages((prev) => [...prev, { role: 'model', text: "I'm having a little trouble thinking straight. Can you click that Retry button?" }]);
      }
    } finally {
      if (activeRequestId.current === requestId) {
        setIsLoading(false);
      }
    }
  };

  // Initialize Scenario
  const initScenario = useCallback(async () => {
    if (showEmailEntry || showIntro || showTransition || showEnding) return;

    // LOCAL STORAGE ID PERSISTENCE:
    // We create a composite key: "gg_session_{SCENARIO_ID}_{EMAIL}"
    // This ensures that if the user comes back to THIS specific scenario, they continue the same DB session
    // instead of creating a new row (UPSERT works on session_id).
    
    // Only proceed if we have an email
    if (!userEmail) return;

    const storageKey = `gg_session_${currentScenario.id}_${userEmail}`;
    let activeSessionId = localStorage.getItem(storageKey);
    
    if (!activeSessionId) {
        activeSessionId = generateUUID();
        localStorage.setItem(storageKey, activeSessionId);
    }
    
    updateSessionId(activeSessionId);

    setMessages([]);
    setStep(ConversationStep.INIT_MISLED);
    setMistakeCount(0);
    
    const requestId = ++activeRequestId.current;
    setIsLoading(true);

    try {
      const initialResponse = await generateBotResponse(
        "", 
        [], 
        SCENARIOS[currentScenarioIndex], 
        ConversationStep.INIT_MISLED,
        0,
        SCENARIOS[currentScenarioIndex].isTutorial || false // Pass isTutorialMode
      );
      
      if (activeRequestId.current !== requestId) return;

      const initialMessages = [{ role: initialResponse.sender, text: initialResponse.text } as Message];
      setMessages(initialMessages);
      
      if (initialResponse.shouldAdvance) {
          setStep(ConversationStep.USER_CORRECTS);
      }
      
      // AUTO-SAVE (Real-time: Initial Bot Message)
      void saveChatSession(activeSessionId, userEmail, SCENARIOS[currentScenarioIndex].id, SCENARIOS[currentScenarioIndex].title, initialMessages);

    } catch (error) {
      console.error("Failed to init scenario", error);
      if (activeRequestId.current === requestId) {
        setMessages([{ role: 'model', text: "I'm having a little trouble thinking straight. Can you click that Retry button?" }]);
      }
    } finally {
      if (activeRequestId.current === requestId) {
        setIsLoading(false);
      }
    }
  }, [currentScenarioIndex, showEmailEntry, showIntro, showTransition, showEnding, userEmail]);

  useEffect(() => {
    initScenario();
  }, [initScenario]);

  const handleEmailSubmit = (email: string) => {
    setUserEmail(email);
    setShowEmailEntry(false);
    setShowIntro(true);
  };

  const handleSendMessage = (text: string) => {
    const messagesWithUser = [...messages, { role: 'user', text } as Message];
    setMessages(messagesWithUser);

    const currentSessionId = sessionIdRef.current; // Use Ref to guarantee latest value

    // AUTO-SAVE (Real-time: User Message)
    if (userEmail && currentSessionId) {
       void saveChatSession(currentSessionId, userEmail, currentScenario.id, currentScenario.title, messagesWithUser);
    }

    processBotInteraction(text, messagesWithUser, currentSessionId);
  };

  const handleResendMessage = () => {
    const currentSessionId = sessionIdRef.current;
    
    const hasUserMessage = messages.some(m => m.role === 'user');
    
    if (!hasUserMessage) {
        initScenario();
        return;
    }

    const cleanMessages = messages.filter(m => !m.text.includes("trouble thinking straight"));
    setMessages(cleanMessages);

    const lastUserMessage = [...cleanMessages].reverse().find(m => m.role === 'user');
    
    if (lastUserMessage) {
       processBotInteraction(lastUserMessage.text, cleanMessages, currentSessionId);
    }
  };

  const handleNextScenario = async () => {
    const nextIndex = currentScenarioIndex + 1;
    
    // Check if we have reached the end of all scenarios
    if (nextIndex >= SCENARIOS.length) {
        setShowEnding(true);
        return;
    }

    const isNextTutorial = SCENARIOS[nextIndex]?.isTutorial;

    if (isTutorial && !isNextTutorial) {
      setShowTransition(true);
    } else {
      setCurrentScenarioIndex(nextIndex);
    }
  };

  const startTutorial = () => {
    setShowIntro(false);
    setCurrentScenarioIndex(0);
  };

  const startTraining = () => {
    setShowTransition(false);
    const firstTrainingIndex = SCENARIOS.findIndex(s => !s.isTutorial);
    setCurrentScenarioIndex(firstTrainingIndex !== -1 ? firstTrainingIndex : 0);
  };

  const returnToMainMenu = () => {
    // Reset all game state
    setShowEnding(false);
    setCurrentScenarioIndex(0);
    setMessages([]);
    setStep(ConversationStep.INIT_MISLED);
    setMistakeCount(0);
    
    // Reset User Session Info to return to Email Screen
    setUserEmail('');
    setSessionId('');
    sessionIdRef.current = '';
    setShowEmailEntry(true);
    setShowIntro(false);
    setShowTransition(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Email Entry Overlay */}
      {showEmailEntry && (
        <EmailScreen onSubmit={handleEmailSubmit} />
      )}

      {/* Intro Overlay */}
      {showIntro && (
        <OverlayScreen
          type="intro"
          title="Welcome to GraphGullible"
          description="In this Tutorial Mode, you will learn how to communicate with our naive AI chatbot. Your goal is to spot the misleading graphs and teach the bot why they are deceptive."
          buttonText="Start Tutorial"
          onStart={startTutorial}
        />
      )}

      {/* Transition Overlay */}
      {showTransition && (
        <OverlayScreen
          type="transition"
          title="Tutorial Complete!"
          description="Great job! You've mastered the basics. Now it's time for the real challenge. Use what you've learned to identify misleading features in various charts and guide the chatbot to the truth."
          buttonText="Start Training"
          onStart={startTraining}
        />
      )}

      {/* Ending Overlay */}
      {showEnding && (
        <OverlayScreen
          type="ending"
          title="Congratulations!"
          description="You have successfully trained GraphGullible on all scenarios! You are now a master of identifying misleading data visualizations."
          buttonText="Go to Main Page"
          onStart={returnToMainMenu}
        />
      )}

      {/* Top Header / Progress Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
          <BarChart3 className="text-indigo-600" />
          GraphGullible
        </h1>

        <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${isTutorial ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-200 ring-offset-1' : 'bg-gray-100 text-gray-400 opacity-50'}`}>
                <GraduationCap size={16} />
                Tutorial
            </div>
            <div className="h-6 w-px bg-gray-200"></div>
            <div className={`flex items-center gap-2 transition-opacity duration-300 ${!isTutorial ? 'opacity-100' : 'opacity-60'}`}>
                <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${!isTutorial ? 'text-indigo-600' : 'text-gray-400'}`}>
                   <Target size={16} />
                   Training Levels
                </div>
                <div className="flex gap-2 ml-2">
                    {Array.from({ length: mainCount }).map((_, idx) => (
                        <div 
                            key={idx}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                mainGameProgress > idx 
                                    ? 'bg-indigo-600 scale-100' 
                                    : mainGameProgress === idx 
                                        ? 'bg-indigo-600 ring-4 ring-indigo-100 scale-110' 
                                        : 'bg-gray-200 scale-100'
                            }`}
                        />
                    ))}
                </div>
            </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-80px)] overflow-hidden p-4 md:p-6 gap-6 max-w-7xl mx-auto w-full relative">
        <div className="w-full md:w-1/2 h-[40vh] md:h-full flex flex-col animate-fadeIn transition-opacity duration-300">
          <GraphDisplay scenario={currentScenario} />
        </div>
        <div className="w-full md:w-1/2 h-[50vh] md:h-full flex flex-col animate-slideUp">
          <ChatInterface 
            messages={messages} 
            onSendMessage={handleSendMessage}
            onResendMessage={handleResendMessage}
            isLoading={isLoading}
            isCompleted={step === ConversationStep.COMPLETED}
            onNextScenario={handleNextScenario}
            isTutorialMode={isTutorial}
            tutorialConfig={currentTutorialConfig}
          />
        </div>
      </div>
    </div>
  );
};

export default App;