// Simple test file to debug the configuration
import { config, shouldUseMock } from './config'

console.log('🔧 Configuration Debug:')
console.log('API URL:', config.apiUrl)
console.log('Use Mock Problems:', config.useMockProblems)
console.log('Should Use Mock (problems):', shouldUseMock('problems'))
console.log('Environment variables:')
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)
console.log('NEXT_PUBLIC_USE_MOCK_PROBLEMS:', process.env.NEXT_PUBLIC_USE_MOCK_PROBLEMS)

export default function ConfigTest() {
  return null
}