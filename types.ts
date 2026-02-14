
export type Role = 'user' | 'model' | 'guide';

export interface Message {
  role: Role;
  text: string;
  isThinking?: boolean;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  value2?: number; // For dual axis or comparison
}

export enum ChartType {
  BAR = 'BAR',
  LINE = 'LINE',
  AREA = 'AREA',
  PIE = 'PIE'
}

export interface TutorialStepOption {
  text: string;
  label: string; // Short label for the button if needed, or just use text
}

export interface TutorialStepConfig {
  guideMessage: string; // The instruction shown to the user (e.g., "Tell the bot it's misled!")
  options: string[]; // The text options the user can choose from
}

export interface Scenario {
  id: number;
  title: string;
  description: string;
  chartType: ChartType;
  data: ChartDataPoint[];
  chartConfig: {
    yAxisDomain?: [number | 'auto', number | 'auto'];
    hideYAxis?: boolean;
    reversedYAxis?: boolean; // For inverted axis scenarios
    barSize?: number;
    colors: string[];
    showGrid?: boolean;
    customTickFormatter?: (value: any) => string;
    seriesNames?: { value: string; value2?: string }; // Custom labels for legend
  };
  aiContext: string;
  isTutorial?: boolean;
  tutorialSteps?: {
    [key: number]: TutorialStepConfig; // Keyed by ConversationStep
  };
}

export enum ConversationStep {
  INIT_MISLED = 0,   // Bot: interprets graph wrongly
  USER_CORRECTS = 1, // User: corrects bot. Bot: "Why was I misled?"
  USER_EXPLAINS_FEATURE = 2, // User: explains feature. Bot: "How to fix?"
  USER_SUGGESTS_FIX = 3, // User: suggests fix. Bot: Thanks & Summary.
  COMPLETED = 4
}

export interface BotResponse {
  text: string;
  sender: 'model' | 'guide';
  shouldAdvance: boolean;
}

// NEW TYPES FOR DASHBOARD FLOW
export type UserGroup = 'A' | 'B';

export type AppView = 'email' | 'dashboard' | 'chat';

export interface ProgressState {
  preSurvey: boolean;
  intervention: boolean;
  postSurvey: boolean;
}
