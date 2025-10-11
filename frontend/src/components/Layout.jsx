import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Sun, Moon, Home, PlusCircle, User, LogOut, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarMinimized, setSidebarMinimized] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { user, logout, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Create Quiz', href: '/create-quiz', icon: PlusCircle },
    { name: 'My Quizzes', href: '/my-quizzes', icon: BookOpen },
    { name: 'Profile', href: '/profile', icon: User },
  ]

  const handleLogout = async () => {
    const result = await logout()
    if (result.success) {
      navigate('/') // Navigate to home page after logout
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className={`bg-card flex-shrink-0 transition-all duration-300 ease-in-out ${
        sidebarMinimized ? 'w-16' : 'w-64'
      } ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
        <div className="flex h-full flex-col">
          {/* Logo and minimize button */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-border">
            <Link to="/" className={`flex items-center space-x-2 ${sidebarMinimized ? 'justify-center' : ''}`}>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">Q</span>
              </div>
              {!sidebarMinimized && (
                <span className="text-xl font-bold text-foreground">QuizX</span>
              )}
            </Link>
            <div className="flex items-center space-x-2">
              {/* Minimize/Maximize button */}
              <button
                onClick={() => setSidebarMinimized(!sidebarMinimized)}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {sidebarMinimized ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sidebarMinimized ? 'justify-center px-2' : ''
                  } ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  title={sidebarMinimized ? item.name : ''}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarMinimized && (
                    <span>{item.name}</span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Theme toggle and logout */}
          <div className={`p-4 border-t border-border space-y-2 ${sidebarMinimized ? 'px-2' : ''}`}>
            <button
              onClick={toggleTheme}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted w-full transition-colors ${
                sidebarMinimized ? 'justify-center px-2' : ''
              }`}
              title={sidebarMinimized ? (theme === 'light' ? 'Dark Mode' : 'Light Mode') : ''}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              {!sidebarMinimized && (
                <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
              )}
            </button>
            <button
              onClick={handleLogout}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted w-full transition-colors ${
                sidebarMinimized ? 'justify-center px-2' : ''
              }`}
              title={sidebarMinimized ? 'Logout' : ''}
            >
              <LogOut className="w-5 h-5" />
              {!sidebarMinimized && (
                <span>Logout</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 min-h-screen">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="lg:hidden">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">Q</span>
              </div>
              <span className="text-xl font-bold text-foreground">QuizX</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {/* Theme toggle removed from top bar - only in sidebar now */}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
