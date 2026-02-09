import React, { useState, useEffect, useCallback } from 'react';
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
  
  // App Flow State
  const [userEmail, setUserEmail] = useState('');
  const [showEmailEntry, setShowEmailEntry] = useState(true);
  const [showIntro, setShowIntro] = useState(false);
  const [showTransition, setShowTransition] = useState(false);

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

  // Initialize Scenario
  const initScenario = useCallback(async () => {
    // Don't initialize if we are showing overlays
    if (showEmailEntry || showIntro || showTransition) return;

    setMessages([]);
    setStep(ConversationStep.INIT_MISLED);
    setIsLoading(true);

    try {
      const initialResponse = await generateBotResponse(
        "", 
        [], 
        SCENARIOS[currentScenarioIndex], 
        ConversationStep.INIT_MISLED
      );
      
      const initialMessages = [{ role: initialResponse.sender, text: initialResponse.text } as Message];
      setMessages(initialMessages);
      
      // If initialization successful, move to User Corrects step
      if (initialResponse.shouldAdvance) {
          setStep(ConversationStep.USER_CORRECTS);
      }
      
      // SAVE TO DB: Only if NOT tutorial and email exists
      if (userEmail && !isTutorial) {
        void saveChatSession(userEmail, SCENARIOS[currentScenarioIndex].id, SCENARIOS[currentScenarioIndex].title, initialMessages);
      }

    } catch (error) {
      console.error("Failed to init scenario", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentScenarioIndex, showEmailEntry, showIntro, showTransition, userEmail, isTutorial]);

  useEffect(() => {
    initScenario();
  }, [initScenario]);

  const handleEmailSubmit = (email: string) => {
    setUserEmail(email);
    setShowEmailEntry(false);
    setShowIntro(true);
  };

  const handleSendMessage = async (text: string) => {
    // 1. Add User Message
    const messagesWithUser = [...messages, { role: 'user', text } as Message];
    setMessages(messagesWithUser);
    setIsLoading(true);

    // Determine what the NEXT step *would* be if successful
    let potentialNextStep = step;
    if (step === ConversationStep.USER_CORRECTS) potentialNextStep = ConversationStep.USER_EXPLAINS_FEATURE;
    else if (step === ConversationStep.USER_EXPLAINS_FEATURE) potentialNextStep = ConversationStep.USER_SUGGESTS_FIX;
    else if (step === ConversationStep.USER_SUGGESTS_FIX) potentialNextStep = ConversationStep.COMPLETED;

    try {
      const response = await generateBotResponse(
        text,
        messagesWithUser,
        currentScenario,
        step 
      );

      // 2. Add Bot Response (could be 'model' or 'guide')
      const finalMessages = [...messagesWithUser, { role: response.sender, text: response.text } as Message];
      setMessages(finalMessages);

      // 3. Handle Step Advancement based on "who" spoke
      if (response.shouldAdvance) {
        setStep(potentialNextStep);
      } else {
        // Guide spoke, or bot didn't understand. Stay on current step.
        // No change to setStep
      }

      // 4. AUTO-SAVE: Only if NOT tutorial
      if (userEmail && !isTutorial) {
        void saveChatSession(userEmail, currentScenario.id, currentScenario.title, finalMessages);
      }

    } catch (error) {
      console.error("Error generating response", error);
      setMessages((prev) => [...prev, { role: 'model', text: "I'm feeling a bit dizzy. Can you repeat that?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextScenario = async () => {
    // Logic for next level
    const nextIndex = currentScenarioIndex + 1;
    const isNextTutorial = SCENARIOS[nextIndex]?.isTutorial;

    if (isTutorial && !isNextTutorial) {
      // Just finished the last tutorial, show transition screen
      setShowTransition(true);
    } else if (nextIndex >= SCENARIOS.length) {
      // Completed all levels, loop back to first TRAINING level
      const firstTrainingIndex = SCENARIOS.findIndex(s => !s.isTutorial);
      setCurrentScenarioIndex(firstTrainingIndex !== -1 ? firstTrainingIndex : 0);
    } else {
      // Normal progression
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