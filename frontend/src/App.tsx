import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ScanListPage from './pages/ScanListPage'
import ScanDetailPage from './pages/ScanDetailPage'
import UploadPage from './pages/UploadPage'
import ProjectsPage from './pages/ProjectsPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ScanListPage />} />
        <Route path="/scans/:id" element={<ScanDetailPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
      </Routes>
    </Layout>
  )
}

export default App
