import React, { useState } from 'react';
import { Mail, ArrowRight, Check, AlertCircle } from 'lucide-react';

interface EmailScreenProps {
  onSubmit: (email: string) => void;
}

const EmailScreen: React.FC<EmailScreenProps> = ({ onSubmit }) => {
  const [email, setEmail] = useState('');
  const [showAgreements, setShowAgreements] = useState(false);
  const [agreements, setAgreements] = useState({
    sitting: false,
    calculator: false,
    tab: false
  });

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setShowAgreements(true);
    }
  };

  const toggleAgreement = (key: keyof typeof agreements) => {
    setAgreements(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFinalSubmit = () => {
    if (Object.values(agreements).every(Boolean)) {
      onSubmit(email);
    }
  };

  if (showAgreements) {
    const allChecked = Object.values(agreements).every(Boolean);
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fadeIn">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 md:p-10 transform transition-all border border-gray-100">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <AlertCircle className="text-indigo-600" />
              Important Instructions
            </h2>
            <p className="text-gray-500 text-sm">
              Please review and agree to the following conditions before starting your session.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors group">
              <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${agreements.sitting ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 group-hover:border-indigo-400'}`}>
                {agreements.sitting && <Check size={14} className="text-white" />}
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={agreements.sitting} 
                onChange={() => toggleAgreement('sitting')} 
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                Please complete all sessions in one sitting. If a pause of more than 5 minutes is detected, we cannot verify your successful completion.
              </span>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors group">
              <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${agreements.calculator ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 group-hover:border-indigo-400'}`}>
                {agreements.calculator && <Check size={14} className="text-white" />}
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={agreements.calculator} 
                onChange={() => toggleAgreement('calculator')} 
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                Please do not use a calculator. Answer questions using only the visible information in the visualizations.
              </span>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors group">
              <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${agreements.tab ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 group-hover:border-indigo-400'}`}>
                {agreements.tab && <Check size={14} className="text-white" />}
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={agreements.tab} 
                onChange={() => toggleAgreement('tab')} 
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                Please keep this tab open until you complete all sessions. You may need to switch tabs for some tasks, but this page must remain active.
              </span>
            </label>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-2">
               <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${allChecked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                  {allChecked && <Check size={10} className="text-white" />}
               </div>
               <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">I understand and agree to all above</span>
            </div>
            <button
              onClick={handleFinalSubmit}
              disabled={!allChecked}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-indigo-200 shadow-lg disabled:shadow-none transition-all flex items-center justify-center gap-2"
            >
              Start Dashboard
              <ArrowRight size={18} />
            </button>
            <button 
              onClick={() => setShowAgreements(false)}
              className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Back to Email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 md:p-10 transform transition-all border border-gray-100">
        <div className="mx-auto w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
          <Mail size={32} />
        </div>
        
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Get Started</h1>
        <p className="text-gray-500 text-center mb-8">
          Please enter your email address to begin your training session.
        </p>
        
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 shadow-lg transition-all flex items-center justify-center gap-2 group"
          >
            Continue
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmailScreen;