import React from 'react';
import { TutorialStepConfig } from '../types';

interface TutorialOverlayProps {
  config: TutorialStepConfig;
  onSelectOption: (text: string) => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ config, onSelectOption }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with semi-transparency to create the "dimmed" effect */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      {/* Content Card */}
      <div className="relative z-10 bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 animate-slideUp">
        <div className="text-center mb-8">
          <div className="inline-block p-3 rounded-full bg-indigo-100 text-indigo-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Training Mode</h2>
          <p className="text-lg text-gray-700 font-medium leading-relaxed">{config.guideMessage}</p>
        </div>

        <div className="space-y-3">
          {config.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => onSelectOption(option)}
              className="w-full text-left p-4 rounded-xl border-2 border-indigo-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700 group-hover:text-indigo-900">{option}</span>
                <span className="text-indigo-300 group-hover:text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </span>
              </div>
            </button>
          ))}
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-400">
           Select the best response to teach the bot.
        </div>
      </div>
    </div>
  );
};

export default TutorialOverlay;