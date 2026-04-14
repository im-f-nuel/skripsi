import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DetectImage from './pages/DetectImage'
import History from './pages/History'
import ModelInfo from './pages/ModelInfo'
import ApiDocs from './pages/ApiDocs'
import Settings from './pages/Settings'
import { getUser } from './lib/auth'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = getUser()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/detect" element={<DetectImage />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/model" element={<ModelInfo />} />
                  <Route path="/api-docs" element={<ApiDocs />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
