export const mockData = {
  Weekly: {
    label: "Weekly Overview",
    dateRange: "Jun 08 - Jun 14, 2026",
    healthScore: 78,
    healthScoreText: "Spending efficiency normal",
    healthScoreDiff: "+3% vs last week",
    healthScoreDiffPositive: true,
    totals: {
      income: { value: 950.00, change: "+5% vs last week", positive: true },
      expenses: { value: 680.40, change: "+1% vs last week", positive: false },
      savings: { value: 269.60, change: "+15% vs last week", positive: true }
    },
    trends: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        { name: "Expenses", color: "#3d2e3c", data: [80, 150, 60, 95, 120, 110, 65.4] },
        { name: "Savings", color: "#34a853", data: [20, 30, 40, 25, 50, 45, 59.6] },
        { name: "Income", color: "#d8cfd6", data: [100, 180, 100, 120, 170, 155, 125] }
      ],
      hoverDetails: [
        { day: "Mon", Expenses: 80, Savings: 20, Income: 100 },
        { day: "Tue", Expenses: 150, Savings: 30, Income: 180 },
        { day: "Wed", Expenses: 60, Savings: 40, Income: 100 },
        { day: "Thu", Expenses: 95, Savings: 25, Income: 120 },
        { day: "Fri", Expenses: 120, Savings: 50, Income: 170 },
        { day: "Sat", Expenses: 110, Savings: 45, Income: 155 },
        { day: "Sun", Expenses: 65.4, Savings: 59.6, Income: 125 }
      ]
    },
    breakdown: [
      { name: "Food & Dining", percentage: 35, value: 238.14, color: "#3d2e3c" },
      { name: "Transport", percentage: 15, value: 102.06, color: "#6b546a" },
      { name: "Shopping", percentage: 22, value: 149.69, color: "#9a7d99" },
      { name: "Bills & Utilities", percentage: 10, value: 68.04, color: "#c6b3c5" },
      { name: "Entertainment", percentage: 12, value: 81.65, color: "#a597a4" },
      { name: "Others", percentage: 6, value: 40.82, color: "#e3dce2" }
    ],
    barChart: {
      labels: ["Wk 1", "Wk 2", "Wk 3", "Wk 4"],
      income: [850, 900, 920, 950],
      expenses: [620, 650, 600, 680]
    },
    heatmap: {
      banner: "Highest spending: Tuesdays between 12 PM - 2 PM",
      highest: "Tuesdays between 12 PM - 2 PM",
      matrix: [
        [1, 1, 2, 1, 1, 3, 2, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 2, 4, 8, 9, 4, 2, 1, 1],
        [1, 1, 1, 1, 2, 3, 4, 3, 2, 2, 1, 1],
        [1, 1, 2, 1, 2, 4, 3, 2, 2, 3, 2, 1],
        [1, 1, 1, 2, 3, 5, 5, 4, 3, 5, 4, 2],
        [2, 1, 1, 2, 4, 6, 7, 6, 5, 6, 5, 3],
        [1, 1, 1, 1, 2, 3, 4, 3, 2, 2, 1, 1]
      ]
    },
    insights: [
      { type: "transport", text: "Transport spending increased by 8% this week.", value: "↑ 8%", typeColor: "danger" },
      { type: "savings", text: "Your savings rate increased by 15% this week.", value: "↑ 15%", typeColor: "success" },
      { type: "card", text: "Dining out expense decreased by 5% vs last week.", value: "↓ 5%", typeColor: "success" }
    ]
  },

  Monthly: {
    label: "Monthly Overview",
    dateRange: "May 2024",
    healthScore: 82,
    healthScoreText: "Spending efficiency improved this month",
    healthScoreDiff: "+8% vs Apr 2024",
    healthScoreDiffPositive: true,
    totals: {
      income: { value: 3450.00, change: "+12% vs Apr", positive: true },
      expenses: { value: 2158.30, change: "-12% vs Apr", positive: true },
      savings: { value: 1291.70, change: "+28% vs Apr", positive: true }
    },
    trends: {
      labels: ["May 1", "May 8", "May 15", "May 22", "May 29"],
      datasets: [
        { name: "Expenses", color: "#3d2e3c", data: [1100, 1400, 2120, 1800, 2158.3] },
        { name: "Savings", color: "#34a853", data: [700, 900, 1200, 1050, 1291.7] },
        { name: "Income", color: "#d8cfd6", data: [1800, 2300, 3320, 2850, 3450] }
      ],
      hoverDetails: [
        { day: "May 1", Expenses: 1100, Savings: 700, Income: 1800 },
        { day: "May 8", Expenses: 1400, Savings: 900, Income: 2300 },
        { day: "May 15", Expenses: 2120, Savings: 1200, Income: 3320 },
        { day: "May 22", Expenses: 1800, Savings: 1050, Income: 2850 },
        { day: "May 29", Expenses: 2158.30, Savings: 1291.70, Income: 3450.00 }
      ]
    },
    breakdown: [
      { name: "Food & Dining", percentage: 28, value: 604.32, color: "#3d2e3c" },
      { name: "Transport", percentage: 20, value: 431.66, color: "#6c536a" },
      { name: "Shopping", percentage: 18, value: 388.49, color: "#957793" },
      { name: "Bills & Utilities", percentage: 15, value: 323.75, color: "#c1a4bf" },
      { name: "Entertainment", percentage: 10, value: 215.83, color: "#cab7c8" },
      { name: "Others", percentage: 9, value: 194.25, color: "#ece6eb" }
    ],
    barChart: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May"],
      income: [2700, 2900, 3200, 3100, 3450],
      expenses: [1800, 2000, 2200, 2100, 2158]
    },
    heatmap: {
      banner: "Highest spending: Saturdays between 1 PM - 4 PM",
      highest: "Saturdays between 1 PM - 4 PM",
      matrix: [
        [1, 1, 1, 2, 2, 2, 3, 3, 2, 2, 2, 1],
        [1, 1, 1, 1, 3, 4, 3, 3, 4, 4, 3, 1],
        [1, 1, 2, 1, 2, 3, 4, 5, 4, 3, 2, 1],
        [1, 1, 1, 2, 2, 3, 3, 4, 3, 3, 2, 1],
        [1, 1, 2, 2, 3, 5, 6, 7, 5, 6, 4, 2],
        [2, 1, 1, 2, 4, 5, 8, 9, 8, 7, 5, 3],
        [1, 1, 1, 2, 3, 4, 3, 4, 3, 3, 2, 1]
      ]
    },
    insights: [
      { type: "transport", text: "Transport spending increased by 15% this month.", value: "↑ 15%", typeColor: "danger" },
      { type: "savings", text: "Your savings rate increased by 8% this month.", value: "↑ 8%", typeColor: "success" },
      { type: "card", text: "Subscription expenses increased by 12%.", value: "↑ 12%", typeColor: "danger" }
    ]
  },

  Yearly: {
    label: "Yearly Overview",
    dateRange: "2024 Full Year",
    healthScore: 85,
    healthScoreText: "Excellent financial management",
    healthScoreDiff: "+5% vs 2023",
    healthScoreDiffPositive: true,
    totals: {
      income: { value: 39500.00, change: "+15% vs 2023", positive: true },
      expenses: { value: 24200.00, change: "-8% vs 2023", positive: true },
      savings: { value: 15300.00, change: "+35% vs 2023", positive: true }
    },
    trends: {
      labels: ["Q1", "Q2", "Q3", "Q4"],
      datasets: [
        { name: "Expenses", color: "#3d2e3c", data: [5800, 6200, 5900, 6300] },
        { name: "Savings", color: "#34a853", data: [3200, 3800, 4100, 4200] },
        { name: "Income", color: "#d8cfd6", data: [9000, 10000, 10000, 10500] }
      ],
      hoverDetails: [
        { day: "Q1", Expenses: 5800, Savings: 3200, Income: 9000 },
        { day: "Q2", Expenses: 6200, Savings: 3800, Income: 10000 },
        { day: "Q3", Expenses: 5900, Savings: 4100, Income: 10000 },
        { day: "Q4", Expenses: 6300, Savings: 4200, Income: 10500 }
      ]
    },
    breakdown: [
      { name: "Food & Dining", percentage: 25, value: 6050.00, color: "#3d2e3c" },
      { name: "Transport", percentage: 18, value: 4356.00, color: "#6c536a" },
      { name: "Shopping", percentage: 20, value: 4840.00, color: "#957793" },
      { name: "Bills & Utilities", percentage: 22, value: 5324.00, color: "#c1a4bf" },
      { name: "Entertainment", percentage: 8, value: 1936.00, color: "#cab7c8" },
      { name: "Others", percentage: 7, value: 1694.00, color: "#ece6eb" }
    ],
    barChart: {
      labels: ["2021", "2022", "2023", "2024"],
      income: [31000, 34000, 36200, 39500],
      expenses: [22500, 23800, 26000, 24200]
    },
    heatmap: {
      banner: "Highest spending: Friday evenings 7 PM - 10 PM",
      highest: "Fridays between 7 PM - 10 PM",
      matrix: [
        [1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 2, 1],
        [1, 1, 1, 2, 2, 3, 4, 3, 4, 3, 2, 1],
        [1, 1, 2, 2, 3, 3, 4, 4, 3, 3, 2, 1],
        [1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 3, 1],
        [2, 1, 1, 2, 3, 5, 5, 6, 8, 9, 6, 3],
        [3, 2, 1, 2, 4, 4, 6, 6, 5, 5, 4, 3],
        [1, 1, 1, 2, 2, 3, 3, 3, 3, 2, 2, 1]
      ]
    },
    insights: [
      { type: "transport", text: "Yearly transport bills optimized by 10%.", value: "↓ 10%", typeColor: "success" },
      { type: "savings", text: "Yearly savings target reached 102% of goal.", value: "↑ 2%", typeColor: "success" },
      { type: "card", text: "Subscription bills increased by 15% vs 2023.", value: "↑ 15%", typeColor: "danger" }
    ]
  }
};
