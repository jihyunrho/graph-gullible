import { Scenario, ChartType, ConversationStep } from './types';

export const SCENARIOS: Scenario[] = [
  // ========================================================================
  // TUTORIAL MODE (2 Distinct Concepts)
  // Flow: 
  // 1. Bot Misinterprets
  // 2. User: "You are wrong" (Step: USER_CORRECTS)
  // 3. User: "Here is the feature" (Step: USER_EXPLAINS_FEATURE)
  // 4. User: "Here is the impact/fix" (Step: USER_SUGGESTS_FIX)
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
        guideMessage: "The bot is happy because the line goes down. Tell it that its interpretation is wrong.",
        options: ["Hold on, your interpretation is actually the opposite of reality."]
      },
      [ConversationStep.USER_EXPLAINS_FEATURE]: {
        guideMessage: "The bot asks what tricked it. Point out the specific visual feature on the Y-axis.",
        options: ["Look at the Y-Axis numbers. 0 is at the top, 250 is at the bottom."]
      },
      [ConversationStep.USER_SUGGESTS_FIX]: {
        guideMessage: "The bot asks how that feature affects the meaning. Explain the impact.",
        options: ["Because it's inverted, a line going 'down' actually means the value is increasing (getting worse)."]
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
        guideMessage: "The bot thinks we are growing faster than ever. Tell it that it's mistaken.",
        options: ["You are misinterpreting the growth trend. We aren't growing faster."]
      },
      [ConversationStep.USER_EXPLAINS_FEATURE]: {
        guideMessage: "The bot is confused because the line is going up. Explain the type of graph.",
        options: ["This is a cumulative graph, so the total number will ALWAYS go up unless we lose users."]
      },
      [ConversationStep.USER_SUGGESTS_FIX]: {
        guideMessage: "The bot asks how to see the real trend. Explain where to look.",
        options: ["You need to look at the slope. It's getting flatter, which means the rate of new users is actually slowing down."]
      }
    }
  },

  // ========================================================================
  // TRAINING MODE (4 Selected Concepts)
  // Concepts: Truncated Y-Axis, Irregular X-Axis, Invalid Pie Chart (Sum > 100%), Missing Normalization
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
    title: "Survey: Favorite Cafeteria Food",
    description: "Results from a student survey allowing multiple choices: 'What do you eat for lunch?'",
    chartType: ChartType.PIE,
    data: [
      { name: 'Pizza', value: 60 },
      { name: 'Burger', value: 50 },
      { name: 'Salad', value: 40 },
    ],
    chartConfig: {
      colors: ['#3b82f6', '#ef4444', '#10b981'],
      showGrid: false,
      seriesNames: { value: "Percentage" }
    },
    aiContext: "The percentages on this Pie Chart add up to 150% (60+50+40), which makes a pie chart misleading. You should ignore the math errors. Just look at the Pizza slice being the biggest (60%) and claim Pizza is the overwhelming winner, ignoring that the categories overlap or the chart type is wrong."
  },
  {
    id: 4,
    title: "Regional Web Traffic",
    description: "Total annual website visitors from two different regions.",
    chartType: ChartType.BAR,
    data: [
      { name: 'USA', value: 50000 },
      { name: 'Iceland', value: 500 },
    ],
    chartConfig: {
      yAxisDomain: [0, 'auto'],
      colors: ['#8b5cf6'],
      showGrid: true,
      seriesNames: { value: "Total Visitors" }
    },
    aiContext: "This graph compares total numbers without normalizing for population. The USA bar is huge, Iceland is tiny. You should say that people in the USA love the site much more than people in Iceland, ignoring the massive population difference."
  }
];

export const SYSTEM_INSTRUCTION_BASE = `
You are a naive, teachable AI agent named "GraphGullible". 
You are participating in a training simulation where a user teaches you about misleading data visualizations.
`;