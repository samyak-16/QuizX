import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import TakeQuiz from './pages/TakeQuiz'
import CreateQuiz from './pages/CreateQuiz'
import QuizResults from './pages/QuizResults'
import Profile from './pages/Profile'
import MyQuizzes from './pages/MyQuizzes'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background text-foreground">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
              <Route path="/create-quiz" element={<ProtectedRoute><Layout><CreateQuiz /></Layout></ProtectedRoute>} />
              <Route path="/quiz/:id" element={<ProtectedRoute><Layout><TakeQuiz /></Layout></ProtectedRoute>} />
              <Route path="/quiz/:id/results" element={<ProtectedRoute><Layout><QuizResults /></Layout></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
              <Route path="/my-quizzes" element={<ProtectedRoute><Layout><MyQuizzes /></Layout></ProtectedRoute>} />
            </Routes>
            <Toaster position="top-right" />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
