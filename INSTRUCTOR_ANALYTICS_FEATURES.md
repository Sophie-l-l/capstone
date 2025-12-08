# Instructor Analytics Dashboard Features

## Overview
Comprehensive class analytics with performance clustering and aggregate visualizations, designed to provide instructors with actionable insights into student performance and learning patterns.

## Key Features

### 1. Performance Clustering
**Three-Tier Classification System:**
- **High Performers**: ≥70% acceptance rate AND ≥60% mastery
- **Average Performers**: 40-70% acceptance rate
- **Struggling Students**: <40% acceptance rate OR <40% mastery

**Visualizations:**
- Progress bars showing distribution across tiers
- Pie chart for visual cluster breakdown
- Color coding: Green (high), Yellow (average), Red (struggling)

### 2. Student Activity & Success Rate Chart
**Multi-Axis Bar Chart:**
- Total submissions per student (left axis)
- Accepted submissions per student (left axis)
- Acceptance rate percentage (right axis)
- Sorted by submission volume (most active first)

**Use Case:** Identify both high-engagement students and those who may need encouragement to practice more.

### 3. Performance Correlation Scatter Plot
**3D Visualization:**
- X-axis: Total submissions
- Y-axis: Acceptance rate percentage
- Bubble size: Mastery level
- Interactive tooltips showing student names

**Insights:** Reveals correlation between practice volume and success rate, identifies outliers.

### 4. Knowledge Component Mastery Analysis
**Vertical Bar Chart:**
- Shows average class mastery per KC (0-100%)
- **Sorted weakest to strongest** - prioritizes intervention areas
- Displays all 10 KCs from BKT implementation:
  - arrays
  - hash_maps
  - two_pointers
  - strings
  - stacks
  - trees
  - dfs
  - recursion
  - math
  - tree_traversal

**Use Case:** Guides curriculum planning by highlighting topics needing more class time.

### 5. Detailed Student Performance Table
**Columns:**
- Student name and email
- Total submissions
- Accepted submissions
- Acceptance rate
- Average mastery across all KCs
- Status badge (At Risk / On Track / Excelling)

**Sorting:** By total submissions (most active first)
**Status Logic:**
- **At Risk**: avgMastery < 0.4 (red badge)
- **Excelling**: acceptanceRate ≥ 0.7 (default badge)
- **On Track**: All others (secondary badge)

### 6. AI-Generated Insights
**Conditional Alerts:**

1. **At-Risk Students Warning** (shows if atRiskStudents > 0):
   - Red background
   - Recommends one-on-one intervention
   - Example: "⚠️ Attention Needed: 1 student(s) showing signs of struggle"

2. **Topic Focus Alert** (shows if weakest KC < 30% mastery):
   - Orange background
   - Identifies specific struggling topic
   - Example: "📚 Topic Focus: The class is struggling with 'recursion' (avg 15% mastery)"

3. **Positive Performance** (shows if class avg acceptance ≥ 70%):
   - Green background
   - Celebrates overall success
   - Example: "🎉 Great Work: Class average acceptance rate is 75%!"

4. **High Engagement** (shows if avg submissions per student > 50):
   - Blue background
   - Highlights active participation
   - Example: "💪 High Engagement: Students are very active with an average of 208 submissions per student!"

## Data Source

### Backend API Endpoint
`GET /api/instructor/classes/:id/analytics`

**Response Structure:**
```typescript
{
  studentStats: [{
    studentId: string
    name: string
    email: string
    totalSubmissions: number      // e.g., 208
    acceptedSubmissions: number    // e.g., 48
    acceptanceRate: number         // e.g., 0.23 (23%)
    avgMastery: number            // e.g., 0.107 (10.7%)
    isAtRisk: boolean             // true if avgMastery < 0.4
  }],
  kcStats: [{
    kc: string                    // e.g., "arrays"
    avgMastery: number            // class average
    studentCount: number          // enrolled students
  }],
  summary: {
    totalStudents: number
    totalSubmissions: number
    atRiskStudents: number
  }
}
```

## Current Production Data (CS201-FALL2025)

**Test Student Performance:**
- Total Submissions: 208
- Accepted: 48
- Acceptance Rate: 23%
- Average Mastery: 10.7%
- Status: At Risk

**This data correctly displays across all visualizations.**

## Technical Implementation

### Libraries Used
- **Recharts**: React charting library
  - ResponsiveContainer
  - BarChart, PieChart, ScatterChart
  - CartesianGrid, Tooltip, Legend
- **shadcn/ui**: Card, Badge, Progress components
- **Lucide Icons**: Target, BarChart3, Brain, AlertCircle, etc.

### File Location
`apps/frontend/app/dashboard/instructor/page.tsx`

### Key Algorithms

**Performance Clustering (client-side):**
```typescript
const performanceClusters = [
  {
    name: 'High Performers',
    count: studentStats.filter(s => 
      s.acceptanceRate >= 0.7 && s.avgMastery >= 0.6
    ).length,
    color: '#10B981',
    criteria: '≥70% acceptance, ≥60% mastery'
  },
  // ... similar for average and struggling
]
```

**KC Mastery Sorting:**
```typescript
const kcMasteryData = kcStats
  .map(kc => ({
    kc: kc.kc,
    mastery: Math.round(kc.avgMastery * 100),
    students: kc.studentCount
  }))
  .sort((a, b) => a.mastery - b.mastery)  // weakest first
  .slice(0, 10)
```

## User Experience

### Navigation
1. Instructor logs in → redirected to `/dashboard/instructor`
2. Dashboard loads class list via API
3. First class auto-selected in tabs
4. Analytics fetch triggered for selected class
5. All charts render with real-time data

### Interactivity
- **Class Tabs**: Switch between different classes
- **Chart Tooltips**: Hover for detailed metrics
- **Loading States**: Spinner during data fetch
- **Responsive Design**: Grid layout adapts to screen size

### Mobile Considerations
- Cards stack vertically on small screens
- Tables scroll horizontally
- Charts maintain aspect ratio

## Deployment

**Production URL:** https://educode-adaptive-platform.vercel.app/dashboard/instructor

**Test Credentials:**
- Email: instructor@example.com
- Password: instructor123

**Backend API:** https://educode-backend-162585155042.us-central1.run.app

## Future Enhancements (Optional)

1. **Time-Series Analysis**: Track class performance over weeks/months
2. **Error Pattern Clustering**: Group students by common error types
3. **Language/Topic Preferences**: Visualize which languages students prefer
4. **Bloom's Taxonomy Distribution**: Show cognitive complexity levels
5. **Student Comparison**: Side-by-side performance analysis
6. **Export Reports**: PDF/CSV download of analytics
7. **Predictive Analytics**: ML models to forecast struggling students earlier

## Validation

**All features tested with:**
- 1 instructor account (instructor@example.com)
- 1 student account (test@example.com)
- 1 class (CS201-FALL2025)
- 208 submissions (48 accepted, 23% rate)
- 10 Knowledge Components

**Confirmed working:**
- ✅ Performance clustering shows 1 in "Struggling Students"
- ✅ Bar chart displays all 208 submissions
- ✅ Scatter plot shows single student data point
- ✅ KC mastery chart shows all 10 topics sorted by weakness
- ✅ Student table shows 23% acceptance rate
- ✅ AI insights trigger "At Risk" and "High Engagement" alerts
- ✅ Status badge shows "At Risk" (red)
- ✅ Charts responsive and tooltips working
