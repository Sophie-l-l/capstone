// Development configuration display component
'use client'

import { config } from '@/lib/config'

export function DevConfig() {
  // Only show in development
  if (!config.isDevelopment) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3 text-xs max-w-sm">
      <div className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
        🔧 Dev Configuration
      </div>
      <div className="space-y-1 text-yellow-700 dark:text-yellow-300">
        <div>API: {config.apiUrl}</div>
        <div>Mock Auth: {config.useMockAuth ? '✅' : '❌'}</div>
        <div>Mock Problems: {config.useMockProblems ? '✅' : '❌'}</div>
        <div>Mock Analytics: {config.useMockAnalytics ? '✅' : '❌'}</div>
      </div>
    </div>
  )
}

export default DevConfig