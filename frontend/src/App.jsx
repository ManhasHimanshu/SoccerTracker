import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import Navbar from './components/Navbar'
import UploadPage from './pages/UploadPage'
import StatusPage from './pages/StatusPage'
import ResultsPage from './pages/ResultsPage'

const socialProviders = ['google']

function App() {
  return (
    <Authenticator socialProviders={socialProviders}>
      {({ signOut, user }) => (
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50">
            <Navbar user={user} signOut={signOut} />
            <main className="max-w-4xl mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Navigate to="/upload" replace />} />
                <Route path="/callback" element={<Navigate to="/upload" replace />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/status/:videoId" element={<StatusPage />} />
                <Route path="/results/:videoId" element={<ResultsPage />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      )}
    </Authenticator>
  )
}

export default App