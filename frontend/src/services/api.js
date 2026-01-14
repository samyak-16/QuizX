import axios from 'axios'

// Base URL from .env or fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send cookies automatically
})

// Request interceptor
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

// Response interceptor: only clear user, no reload
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user') // clear local storage
      // Don't reload — let ProtectedRoute handle redirect
    }
    return Promise.reject(error)
  }
)

// ---------------- AUTH API ----------------
export const authAPI = {
  register: async (userData) => {
    const res = await api.post('/users/register', userData)
    return res.data
  },

  login: async (credentials) => {
    const res = await api.post('/users/login', credentials)
    return res.data
  },

  logout: async () => {
    const res = await api.post('/users/logout')
    return res.data
  },

  getProfile: async () => {
    const res = await api.get('/profile')
    return res.data
  },

  getUserQuizzes: async () => {
    const res = await api.get('/profile/quizzes')
    return res.data
  },
}

// ---------------- QUIZ API ----------------
export const quizAPI = {
  createQuiz: async (quizData) => {
    const res = await api.post('/quizzes/create', quizData)
    return res.data
  },

  getQuiz: async (quizId) => {
    const res = await api.get(`/quizzes/${quizId}`)
    return res.data
  },

  submitQuiz: async (submissionData) => {
    const res = await api.post('/quizzes/submit', submissionData)
    return res.data
  },

  getAllQuizzes: async () => {
    const res = await api.get('/quizzes')
    return res.data
  },
}

// ---------------- GAME API ----------------
export const gameAPI = {
  createGameSession: async (quizId, settings = {}) => {
    const res = await api.post('/games/create', { quizId, settings })
    return res.data
  },

  validateGameCode: async (code) => {
    const res = await api.get(`/games/join/${code}`)
    return res.data
  },

  getGameSession: async (sessionId) => {
    const res = await api.get(`/games/session/${sessionId}`)
    return res.data
  },

  getGameResults: async (sessionId) => {
    const res = await api.get(`/games/results/${sessionId}`)
    return res.data
  },

  getGameHistory: async (page = 1, limit = 10) => {
    const res = await api.get(`/games/history?page=${page}&limit=${limit}`)
    return res.data
  },
}

// ---------------- LEADERBOARD API ----------------
export const leaderboardAPI = {
  getGlobalLeaderboard: async (page = 1, limit = 50) => {
    const res = await api.get(`/leaderboard/global?page=${page}&limit=${limit}`)
    return res.data
  },

  getWeeklyLeaderboard: async (limit = 50) => {
    const res = await api.get(`/leaderboard/weekly?limit=${limit}`)
    return res.data
  },

  getQuizLeaderboard: async (quizId, limit = 50) => {
    const res = await api.get(`/leaderboard/quiz/${quizId}?limit=${limit}`)
    return res.data
  },

  getGameLeaderboard: async (gameCode) => {
    const res = await api.get(`/leaderboard/game/${gameCode}`)
    return res.data
  },

  getMyRank: async () => {
    const res = await api.get('/leaderboard/my-rank')
    return res.data
  },
}

export default api
