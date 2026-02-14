
import React, { useState, useEffect, useCallback, useRef } from 'react';
import GraphDisplay from './components/GraphDisplay';
import ChatInterface from './components/ChatInterface';
import OverlayScreen from './components/OverlayScreen';
import EmailScreen from './components/EmailScreen';
import Dashboard from './components/Dashboard';
import { SCENARIOS } from './constants';
import { generateBotResponse } from './services/geminiService';
import { saveChatSession, saveUserGroup } from './services/dbService';
import { Message, ConversationStep, UserGroup, AppView, ProgressState } from './types';
import { BarChart3, GraduationCap, Target, ArrowLeft } from 'lucide-react';

const App: React.FC = () => {
  // Navigation & Group State
  const [view, setView] = useState<AppView>('email'); // email -> dashboard -> chat
  const [userGroup, setUserGroup] = useState<UserGroup>('A'); 
  const [progress, setProgress] = useState<ProgressState>({
    preSurvey: false,
    intervention: false,
    postSurvey: false
  });

  // Chat/Scenario State
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<ConversationStep>(ConversationStep.INIT_MISLED);
  const [isLoading, setIsLoading] = useState(false);
  const [mistakeCount, setMistakeCount] = useState(0);
  
  // Track the unique session ID for the current scenario run
  const [sessionId, setSessionId] = useState<string>('');
  const sessionIdRef = useRef<string>('');
  const activeRequestId = useRef(0);
  
  // App Flow State (within Chat View)
  const [userEmail, setUserEmail] = useState('');
  const [showIntro, setShowIntro] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [showEnding, setShowEnding] = useState(false);

  const currentScenario = SCENARIOS[currentScenarioIndex];
  const isTutorial = currentScenario.isTutorial === true;
  const isUserTurn = !isLoading && step !== ConversationStep.COMPLETED && step !== ConversationStep.INIT_MISLED;

  const currentTutorialConfig = isTutorial && isUserTurn ? currentScenario.tutorialSteps?.[step] : undefined;

  const totalScenarios = SCENARIOS.length;
  const tutorialCount = SCENARIOS.filter(s => s.isTutorial).length;
  const mainCount = totalScenarios - tutorialCount;
  
  const isMainGame = !isTutorial;
  const mainGameProgress = isMainGame ? (currentScenarioIndex - tutorialCount) : -1;

  // --- HELPERS ---

  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  const updateSessionId = (id: string) => {
    setSessionId(id);
    sessionIdRef.current = id;
  };

  // --- LOGIC: CHAT INTERACTION ---

  const processBotInteraction = async (userText: string, currentHistory: Message[], activeSessionId: string) => {
    const requestId = ++activeRequestId.current;
    setIsLoading(true);

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
        isTutorial
      );

      if (activeRequestId.current !== requestId) return;

      const finalMessages = [...currentHistory, { role: response.sender, text: response.text } as Message];
      setMessages(finalMessages);

      if (response.shouldAdvance) {
        setStep(potentialNextStep);
        setMistakeCount(0);
      } else if (response.sender === 'guide') {
        setMistakeCount(prev => prev + 1);
      }

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

  // --- LOGIC: SCENARIO INIT ---

  const initScenario = useCallback(async () => {
    if (view !== 'chat' || showIntro || showTransition || showEnding) return;
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
        SCENARIOS[currentScenarioIndex].isTutorial || false
      );
      
      if (activeRequestId.current !== requestId) return;

      const initialMessages = [{ role: initialResponse.sender, text: initialResponse.text } as Message];
      setMessages(initialMessages);
      
      if (initialResponse.shouldAdvance) {
          setStep(ConversationStep.USER_CORRECTS);
      }
      
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
  }, [currentScenarioIndex, showIntro, showTransition, showEnding, userEmail, view, currentScenario]);

  useEffect(() => {
    initScenario();
  }, [initScenario]);

  // --- HANDLERS: USER ACTIONS ---

  const handleEmailSubmit = (email: string) => {
    setUserEmail(email);
    // Random A/B Assignment
    const randomGroup = Math.random() < 0.5 ? 'A' : 'B';
    setUserGroup(randomGroup);
    
    // Save Group Assignment to DB
    void saveUserGroup(email, randomGroup);

    setView('dashboard');
  };

  const handleStartChatIntervention = () => {
    setView('chat');
    setShowIntro(true); // Always start with Intro overlay when entering chat
    setCurrentScenarioIndex(0); // Reset to beginning
  };

  const handleUpdateProgress = (key: keyof ProgressState, value: boolean) => {
    setProgress(prev => ({ ...prev, [key]: value }));
  };

  const handleSendMessage = (text: string) => {
    const messagesWithUser = [...messages, { role: 'user', text } as Message];
    setMessages(messagesWithUser);
    const currentSessionId = sessionIdRef.current;
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

  // Called when finishing the ENTIRE chat module
  const completeChatModule = () => {
    // Mark intervention as complete
    handleUpdateProgress('intervention', true);
    // Reset Chat State
    setShowEnding(false);
    setCurrentScenarioIndex(0);
    setMessages([]);
    setStep(ConversationStep.INIT_MISLED);
    setMistakeCount(0);
    setSessionId('');
    sessionIdRef.current = '';
    // Return to Dashboard
    setView('dashboard');
  }

  // Back button for dashboard (optional, if user wants to bail out of chat mid-way)
  const returnToDashboard = () => {
      setView('dashboard');
  }

  // --- RENDER ---

  if (view === 'email') {
      return (
         <div className="min-h-screen bg-gray-50 flex flex-col">
            <EmailScreen onSubmit={handleEmailSubmit} />
         </div>
      );
  }

  if (view === 'dashboard') {
      return (
          <Dashboard 
            userGroup={userGroup}
            userEmail={userEmail}
            progress={progress}
            onUpdateProgress={handleUpdateProgress}
            onStartChat={handleStartChatIntervention}
          />
      );
  }

  // VIEW === 'CHAT'
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
          title="Module Complete!"
          description="You have successfully trained GraphGullible on all scenarios! You are now a master of identifying misleading data visualizations."
          buttonText="Return to Dashboard" // Changed text
          onStart={completeChatModule} // Changed Handler
        />
      )}

      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <button 
                onClick={returnToDashboard} 
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
                title="Back to Dashboard"
            >
                <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
            <BarChart3 className="text-indigo-600" />
            GraphGullible
            </h1>
        </div>

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
