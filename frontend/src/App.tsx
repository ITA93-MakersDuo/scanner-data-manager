import { Routes, Route } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import LoginPage from './pages/LoginPage'
import ScanListPage from './pages/ScanListPage'
import ScanDetailPage from './pages/ScanDetailPage'
import UploadPage from './pages/UploadPage'
import ProjectsPage from './pages/ProjectsPage'
import { Loader2 } from 'lucide-react'

function App() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <Layout>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<ScanListPage />} />
          <Route path="/scans/:id" element={<ScanDetailPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
        </Routes>
      </ErrorBoundary>
    </Layout>
  )
}

export default App
