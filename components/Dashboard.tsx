
import React, { useState } from 'react';
import { CheckCircle2, Lock, Play, ExternalLink, ClipboardList, MessageSquare, Award, ArrowRight } from 'lucide-react';
import { UserGroup, ProgressState } from '../types';
import { SURVEY_CONFIG } from '../constants';

interface DashboardProps {
  userGroup: UserGroup;
  userEmail: string;
  progress: ProgressState;
  onUpdateProgress: (key: keyof ProgressState, value: boolean) => void;
  onStartChat: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  userGroup, 
  userEmail,
  progress, 
  onUpdateProgress, 
  onStartChat 
}) => {
  const [inputCode, setInputCode] = useState('');
  const [activeModal, setActiveModal] = useState<'pre' | 'post' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Determine which URLs to use based on group
  const urls = userGroup === 'A' ? SURVEY_CONFIG.groupA : SURVEY_CONFIG.groupB;

  const handleOpenSurvey = (type: 'pre' | 'post') => {
    const url = type === 'pre' ? urls.preSurveyUrl : urls.postSurveyUrl;
    window.open(url, '_blank');
    setActiveModal(type);
    setInputCode('');
    setErrorMsg('');
  };

  const verifyCode = (type: 'pre' | 'post') => {
    const requiredCode = type === 'pre' ? SURVEY_CONFIG.completionCodes.preSurvey : SURVEY_CONFIG.completionCodes.postSurvey;
    
    if (inputCode.trim().toUpperCase() === requiredCode) {
      if (type === 'pre') {
        onUpdateProgress('preSurvey', true);
      } else {
        onUpdateProgress('postSurvey', true);
      }
      setActiveModal(null);
    } else {
      setErrorMsg('Invalid code. Please check the end of the survey.');
    }
  };

  const StepCard = ({ 
    title, 
    description, 
    status, 
    icon: Icon,
    actionLabel,
    onAction,
    isLocked
  }: { 
    title: string, 
    description: string, 
    status: 'incomplete' | 'complete', 
    icon: any,
    actionLabel: string,
    onAction: () => void,
    isLocked: boolean
  }) => (
    <div className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
      isLocked 
        ? 'bg-gray-50 border-gray-200 opacity-75' 
        : status === 'complete'
          ? 'bg-emerald-50 border-emerald-100'
          : 'bg-white border-gray-200 hover:border-indigo-300 shadow-sm hover:shadow-md'
    }`}>
      <div className="p-6 flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          status === 'complete' 
            ? 'bg-emerald-100 text-emerald-600' 
            : isLocked 
              ? 'bg-gray-100 text-gray-400'
              : 'bg-indigo-100 text-indigo-600'
        }`}>
          {status === 'complete' ? <CheckCircle2 size={24} /> : <Icon size={24} />}
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className={`text-lg font-bold ${status === 'complete' ? 'text-emerald-900' : 'text-gray-900'}`}>
              {title}
            </h3>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
              status === 'complete' 
                ? 'bg-emerald-100 text-emerald-700' 
                : isLocked
                  ? 'bg-gray-200 text-gray-500'
                  : 'bg-amber-100 text-amber-700'
            }`}>
              {status === 'complete' ? 'Completed' : isLocked ? 'Locked' : 'Incomplete'}
            </span>
          </div>
          
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
            {description}
          </p>
          
          {status !== 'complete' && (
            <button
              onClick={onAction}
              disabled={isLocked}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                isLocked 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              {isLocked ? (
                <><Lock size={14} /> Locked</>
              ) : (
                <>{actionLabel} <ArrowRight size={14} /></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Training Procedure</h1>
          <p className="text-gray-500">Complete the steps below in order to finish the session.</p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
             <span>Assigned Group: {userGroup}</span>
             <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
             <span>{userEmail}</span>
          </div>
        </div>

        <div className="space-y-6">
          {/* STEP 1: PRE-SURVEY */}
          <StepCard
            title="Step 1: Pre-Survey"
            description="Before we begin, please tell us a bit about your experience with data visualizations. This helps us tailor the research."
            status={progress.preSurvey ? 'complete' : 'incomplete'}
            icon={ClipboardList}
            actionLabel="Start Survey"
            isLocked={false}
            onAction={() => handleOpenSurvey('pre')}
          />

          {/* STEP 2: CHAT INTERVENTION */}
          <StepCard
            title="Step 2: Chat Intervention"
            description="Teach the AI agent 'GraphGullible' how to spot misleading graphs. Completing both Tutorial and Training modes is required."
            status={progress.intervention ? 'complete' : 'incomplete'}
            icon={MessageSquare}
            actionLabel="Start Training"
            isLocked={!progress.preSurvey}
            onAction={onStartChat}
          />

          {/* STEP 3: POST-SURVEY */}
          <StepCard
            title="Step 3: Post-Survey"
            description="Reflect on your experience. Once completed, you will receive your final completion code."
            status={progress.postSurvey ? 'complete' : 'incomplete'}
            icon={Award}
            actionLabel="Final Assessment"
            isLocked={!progress.intervention}
            onAction={() => handleOpenSurvey('post')}
          />
        </div>

        {progress.postSurvey && (
            <div className="mt-10 p-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl text-white text-center shadow-xl animate-fadeIn">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Award size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">All Steps Completed!</h2>
                <p className="text-indigo-100">Thank you for participating in our study. You may now close this window.</p>
            </div>
        )}
      </div>

      {/* Verification Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {activeModal === 'pre' ? 'Complete Pre-Survey' : 'Complete Post-Survey'}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              A new tab has opened with the survey. Please enter the <strong>completion code</strong> shown at the end of the survey form.
            </p>
            
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Completion Code</label>
              <input 
                type="text" 
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="e.g. START123"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-mono uppercase"
              />
              {errorMsg && <p className="text-red-500 text-sm mt-2">{errorMsg}</p>}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setActiveModal(null)}
                className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => verifyCode(activeModal)}
                className="flex-1 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                Verify & Continue
              </button>
            </div>
            
            <div className="mt-4 text-center">
                 <button onClick={() => handleOpenSurvey(activeModal)} className="text-xs text-indigo-600 hover:underline flex items-center justify-center gap-1 mx-auto">
                    <ExternalLink size={12} />
                    Link didn't open? Click here
                 </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
