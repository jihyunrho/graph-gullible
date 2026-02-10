import React from 'react';
import { Play, Sparkles, GraduationCap, Trophy } from 'lucide-react';

interface OverlayScreenProps {
  title: string;
  description: string;
  buttonText: string;
  onStart: () => void;
  type: 'intro' | 'transition' | 'ending';
}

const OverlayScreen: React.FC<OverlayScreenProps> = ({ title, description, buttonText, onStart, type }) => {
  const isIntro = type === 'intro';
  const isEnding = type === 'ending';
  
  // Dynamic styles based on type
  let iconBg = 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-indigo-200';
  let buttonBg = 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200';
  let Icon = Sparkles;

  if (isIntro) {
      iconBg = 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-amber-200';
      buttonBg = 'bg-amber-500 hover:bg-amber-600 shadow-amber-200';
      Icon = GraduationCap;
  } else if (isEnding) {
      iconBg = 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-emerald-200';
      buttonBg = 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200';
      Icon = Trophy;
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-10 text-center transform transition-all hover:scale-[1.01] border border-gray-100">
        <div className={`mx-auto w-20 h-20 rounded-3xl flex items-center justify-center mb-8 shadow-xl ${iconBg}`}>
          <Icon size={40} />
        </div>
        
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">{title}</h1>
        
        <div className="w-16 h-1 bg-gray-100 mx-auto mb-6 rounded-full"></div>
        
        <p className="text-gray-600 text-lg leading-relaxed mb-10 font-medium">
          {description}
        </p>
        
        <button
          onClick={onStart}
          className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all transform hover:translate-y-[-2px] active:translate-y-0 shadow-lg flex items-center justify-center gap-2 group ${buttonBg}`}
        >
          {buttonText}
          <Play size={20} className="fill-current opacity-80 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default OverlayScreen;