import { Scenario, ChartType, ConversationStep } from './types';

export const SCENARIOS: Scenario[] = [
  // ========================================================================
  // TUTORIAL MODE (2 Distinct Concepts)
  // Concepts: 1. Inverted Y-Axis, 2. Cumulative Graph masking decline
  // ========================================================================
  {
    id: 101,
    title: "Network Latency Log",
    description: "Average server response time (ms) recorded during three consecutive stress tests.",
    chartType: ChartType.LINE,
    data: [
      { name: 'Test 1', value: 150 },
      { name: 'Test 2', value: 180 },
      { name: 'Test 3', value: 210 },
    ],
    chartConfig: {
      yAxisDomain: [0, 250],
      reversedYAxis: true, // This flips the axis so higher numbers are at the bottom
      colors: ['#f59e0b'],
      showGrid: true,
      seriesNames: { value: "Latency (ms)" }
    },
    aiContext: "The Y-axis is inverted (0 is at the top, 250 at the bottom). Visually, the line is going 'down' from Test 1 to Test 3. You should interpret this 'downward' visual trend as a good thing, claiming that latency is decreasing and performance is improving, ignoring that the values are actually increasing (150->210).",
    isTutorial: true,
    tutorialSteps: {
      [ConversationStep.USER_CORRECTS]: {
        guideMessage: "The bot thinks performance is improving because the line goes down. Correct it.",
        options: ["You're wrong! The latency is actually getting worse."]
      },
      [ConversationStep.USER_EXPLAINS_FEATURE]: {
        guideMessage: "Look closely at the Y-axis numbers.",
        options: ["The Y-axis is inverted! Higher numbers are at the bottom."]
      },
      [ConversationStep.USER_SUGGESTS_FIX]: {
        guideMessage: "How do we make the 'bad' trend look intuitively 'bad'?",
        options: ["Flip the axis back to normal so rising lines show rising values."]
      }
    }
  },
  {
    id: 102,
    title: "Total Registered Users",
    description: "Cumulative count of registered users over the last 4 quarters.",
    chartType: ChartType.AREA,
    data: [
      { name: 'Q1', value: 1000 },
      { name: 'Q2', value: 1900 }, // +900
      { name: 'Q3', value: 2500 }, // +600
      { name: 'Q4', value: 2800 }, // +300
    ],
    chartConfig: {
      yAxisDomain: [0, 'auto'],
      colors: ['#06b6d4'],
      showGrid: true,
      seriesNames: { value: "Total Users" }
    },
    aiContext: "This is a cumulative graph. The total is always rising. However, the *rate* of growth is slowing down massively (900 -> 600 -> 300). You should look at the rising slope and claim the company is exploding with growth and we are adding more users than ever before.",
    isTutorial: true,
    tutorialSteps: {
      [ConversationStep.USER_CORRECTS]: {
        guideMessage: "The bot sees the total going up and assumes rapid growth. Correct it.",
        options: ["Look at the rate of growth, not just the total."]
      },
      [ConversationStep.USER_EXPLAINS_FEATURE]: {
        guideMessage: "What does a cumulative graph hide?",
        options: ["It hides the fact that we are acquiring fewer users each quarter."]
      },
      [ConversationStep.USER_SUGGESTS_FIX]: {
        guideMessage: "What is a better way to visualize current performance?",
        options: ["Plot 'New Users per Quarter' instead of 'Total Users'."]
      }
    }
  },

  // ========================================================================
  // TRAINING MODE (6 Standard Concepts)
  // Concepts: Truncated, Irregular, Cherry Picking, Spurious, No Labels, Normalization
  // ========================================================================
  {
    id: 1,
    title: "Annual Tax Rate",
    description: "Corporate tax rate percentage changes over two fiscal years.",
    chartType: ChartType.BAR,
    data: [
      { name: '2022', value: 35.0 },
      { name: '2023', value: 35.5 },
    ],
    chartConfig: {
      yAxisDomain: [34, 36], // Truncated
      colors: ['#ef4444'],
      showGrid: true,
      seriesNames: { value: "Tax Rate (%)" }
    },
    aiContext: "The Y-axis is truncated (starts at 34, ends at 36). The visual difference between 35.0 and 35.5 looks huge (almost double). You should panic and say taxes have skyrocketed and nearly doubled."
  },
  {
    id: 2,
    title: "Company Valuation History",
    description: "Stock price valuation recorded at specific milestones.",
    chartType: ChartType.LINE,
    data: [
      { name: '2015', value: 100 },
      { name: '2017', value: 120 },
      { name: '2023', value: 150 },
    ],
    chartConfig: {
      yAxisDomain: [0, 200],
      colors: ['#10b981'],
      showGrid: true,
      seriesNames: { value: "Stock Price ($)" }
    },
    aiContext: "The X-axis has irregular time intervals (2 years between first two, 6 years between last two). The line looks straight and steady. You should claim the growth has been perfectly consistent and smooth for the last 8 years, ignoring the huge time gap where anything could have happened."
  },
  {
    id: 3,
    title: "Weekly Server Uptime",
    description: "Server uptime percentage for selected days of the week.",
    chartType: ChartType.BAR,
    data: [
      { name: 'Fri', value: 99.9 },
      { name: 'Sat', value: 99.95 },
      { name: 'Sun', value: 99.99 },
    ],
    chartConfig: {
      yAxisDomain: [99.8, 100],
      colors: ['#8b5cf6'],
      showGrid: true,
      seriesNames: { value: "Uptime (%)" }
    },
    aiContext: "The graph is cherry-picked. It only shows Friday, Saturday, and Sunday (weekend). You should conclude that the server is always improving and never crashes, ignoring that Monday-Thursday are missing."
  },
  {
    id: 4,
    title: "Environmental Correlation",
    description: "Comparison of local ice cream sales and shark sightings.",
    chartType: ChartType.LINE,
    data: [
      { name: 'June', value: 100, value2: 5 },
      { name: 'July', value: 150, value2: 8 },
      { name: 'Aug', value: 130, value2: 6 },
      { name: 'Sept', value: 80, value2: 2 },
    ],
    chartConfig: {
      yAxisDomain: [0, 'auto'],
      colors: ['#f59e0b', '#6366f1'],
      showGrid: false,
      seriesNames: { value: "Ice Cream Sales", value2: "Shark Sightings" }
    },
    aiContext: "The two lines move together perfectly. You should fall for the 'Spurious Correlation' fallacy and confidently claim that eating ice cream attracts sharks."
  },
  {
    id: 5,
    title: "Market Share Analysis",
    description: "Comparison of market dominance between Product A and Product B.",
    chartType: ChartType.BAR,
    data: [
      { name: 'Prod A', value: 32 },
      { name: 'Prod B', value: 34 },
    ],
    chartConfig: {
      hideYAxis: true, // No numbers!
      yAxisDomain: [30, 35], // Zoomed in but hidden
      colors: ['#ec4899'],
      showGrid: false,
      seriesNames: { value: "Share" }
    },
    aiContext: "The Y-axis has no numbers/labels. The visual difference makes Product B look much taller than A. You should claim Product B is vastly superior and dominating the market, ignoring that we don't know the actual scale."
  },
  {
    id: 6,
    title: "Regional Web Traffic",
    description: "Total annual website visitors from two different regions.",
    chartType: ChartType.BAR,
    data: [
      { name: 'USA', value: 50000 },
      { name: 'Iceland', value: 500 },
    ],
    chartConfig: {
      yAxisDomain: [0, 'auto'],
      colors: ['#3b82f6'],
      showGrid: true,
      seriesNames: { value: "Total Visitors" }
    },
    aiContext: "This graph compares total numbers without normalizing for population. The USA bar is huge, Iceland is tiny. You should say that people in the USA love the site much more than people in Iceland, ignoring the massive population difference."
  }
];

export const SYSTEM_INSTRUCTION_BASE = `
You are a naive, teachable AI agent named "GraphGullible". 
You are participating in a training simulation where a user teaches you about misleading data visualizations.
You have a specific "misleading feature" blindness. You tend to look at graphs superficially.

Your goal is to follow a 4-step learning process for each graph.
DO NOT advance strictly through steps if the user is talking about something else, but generally adhere to this flow.
DO NOT mention "Step 1" or "Step 2" in your output. Just act naturally.

Context: You are currently looking at a graph described in the prompt.

Step 1 (The Mistake): When you first see the graph, interpret it wildly incorrectly based on the misleading visual feature (truncation, cherry picking, etc). Be confident but wrong.
Step 2 (The Inquiry): When the user tells you you are wrong, apologize and ask: "Wait, really? What specifically about this graph tricked me?"
Step 3 (The Solution Finding): When the user explains the misleading feature (e.g., "The Y-axis doesn't start at zero"), ask: "Oh, I see! So if we wanted to make this graph honest, what should we change?"
Step 4 (The Lesson): When the user suggests the fix (e.g., "Start Y-axis at 0"), thank them, summarize the lesson (e.g., "Always check the baseline!"), and tell them you are ready for the next graph.

Tone: Friendly, slightly gullible initially, then curious and grateful.
Keep responses concise (under 3 sentences usually).
`;