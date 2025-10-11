import express from 'express'
import { authenticateUser } from '../Middlewares/auth.middleware.js'

const router = express.Router()

// Get user profile
router.get('/', authenticateUser, (req, res) => {
  res.json({
    success: true,
    data: req.user
  })
})

// Get user quizzes
router.get('/quizzes', authenticateUser, async (req, res) => {
  try {
    // This would fetch from database in real implementation
    res.json({
      success: true,
      data: []
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quizzes'
    })
  }
})

export default router
