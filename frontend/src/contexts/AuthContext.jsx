import { createContext, useContext, useEffect, useState } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Function to refresh user data from backend
  const refreshUser = async () => {
    try {
      const response = await authAPI.getProfile()
      if (response.success && response.data) {
        setUser(response.data)
        localStorage.setItem('user', JSON.stringify(response.data))
        return response.data
      }
      return null
    } catch (error) {
      console.error('Failed to refresh user data:', error)
      return null
    }
  }

  useEffect(() => {
    // Only check authentication status once on mount - NO RETRIES
    const initializeAuth = async () => {
      try {
        const response = await authAPI.getProfile()
        if (response.success && response.data) {
          setUser(response.data)
        } else {
          // 401 or other error - user is not authenticated
          setUser(null)
        }
      } catch (error) {
        // Any error (including 401) means user is not authenticated
        console.log('Authentication check failed - user not logged in')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    // Only run once on mount - NEVER retry
    initializeAuth()
  }, []) // Empty dependency array - run exactly once

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials)
      // After successful login, try to fetch user profile
      try {
        const profileResponse = await authAPI.getProfile()
        if (profileResponse.success && profileResponse.data) {
          setUser(profileResponse.data)
        }
      } catch (profileError) {
        // Profile fetch failed, but login succeeded - still consider it successful
        console.log('Login successful but profile fetch failed')
      }
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      }
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
      setUser(null)
      // Don't navigate here - let the component handle navigation
      return { success: true }
    } catch (error) {
      // Even if logout fails on server, clear user state
      setUser(null)
      return { success: true }
    }
  }

  // Manual refresh function for when needed
  const refreshAuth = async () => {
    try {
      const response = await authAPI.getProfile()
      if (response.success && response.data) {
        setUser(response.data)
        return response.data
      } else {
        setUser(null)
        return null
      }
    } catch (error) {
      console.log('Authentication refresh failed - user not logged in')
      setUser(null)
      return null
    }
  }

  const value = {
    user,
    login,
    register,
    logout,
    refreshUser,
    refreshAuth,
    isAuthenticated: !!user,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
