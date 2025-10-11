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

export default api
