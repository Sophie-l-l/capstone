// Configuration utility for switching between mock and real data
export const config = {
  // API Configuration
  apiUrl: process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
      ? 'https://educode-backend-162585155042.us-central1.run.app'
      : 'http://localhost:3001'),
  
  // Feature Flags for Development
  useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true',
  useMockAuth: process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true',
  useMockProblems: process.env.NEXT_PUBLIC_USE_MOCK_PROBLEMS === 'true',
  useMockAnalytics: process.env.NEXT_PUBLIC_USE_MOCK_ANALYTICS === 'true',
  
  // Helper function to check if we should use mock data for a specific feature
  shouldUseMock: (feature: 'auth' | 'problems' | 'analytics' | 'all') => {
    switch (feature) {
      case 'auth':
        return config.useMockAuth
      case 'problems':
        return config.useMockProblems
      case 'analytics':
        return config.useMockAnalytics
      case 'all':
        return config.useMockData
      default:
        return config.useMockData
    }
  },
  
  // Development helpers
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
}

// Export individual flags for convenience
export const {
  apiUrl,
  useMockData,
  useMockAuth,
  useMockProblems,
  useMockAnalytics,
  shouldUseMock,
  isDevelopment,
  isProduction,
} = config

// Log configuration in development
if (isDevelopment && typeof window !== 'undefined') {
  console.log('🔧 Frontend Configuration:', {
    apiUrl,
    useMockData,
    useMockAuth,
    useMockProblems,
    useMockAnalytics,
  })
}