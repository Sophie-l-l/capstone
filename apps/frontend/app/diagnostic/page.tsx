'use client';

// Diagnostic page to check environment variables
export default function DiagnosticPage() {
  const config = {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'NOT SET',
    useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA || 'NOT SET',
    useMockAuth: process.env.NEXT_PUBLIC_USE_MOCK_AUTH || 'NOT SET',
    nodeEnv: process.env.NODE_ENV || 'NOT SET',
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>🔍 Environment Variables Diagnostic</h1>
      <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
        {JSON.stringify(config, null, 2)}
      </pre>
      
      <h2>Test Backend Connection</h2>
      <button 
        onClick={async () => {
          try {
            const response = await fetch(`${config.apiUrl}/health`)
            const data = await response.json()
            alert('Success! Backend response: ' + JSON.stringify(data))
          } catch (error) {
            alert('Error: ' + error)
          }
        }}
        style={{
          padding: '0.5rem 1rem',
          background: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Test Backend Health Endpoint
      </button>

      <h2>Expected Values</h2>
      <ul>
        <li>apiUrl: https://educode-backend-162585155042.us-central1.run.app</li>
        <li>useMockData: false</li>
        <li>useMockAuth: false</li>
      </ul>
    </div>
  )
}
