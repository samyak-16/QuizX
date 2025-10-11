import { useState, useEffect } from 'react'
import { PlusCircle, BookOpen, TrendingUp, Award, Users, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { quizAPI } from '../services/api'

const Dashboard = () => {
  const { user, refreshAuth } = useAuth()
  const [stats, setStats] = useState({
    quizzesCreated: 0,
    quizzesAttempted: 0,
    averageScore: 0,
    studyStreak: 0,
  })
  const [recentQuizzes, setRecentQuizzes] = useState([])
  const [loading, setLoading] = useState(true)

  const handleRefresh = async () => {
    if (!user) return

    try {
      setLoading(true)
      await refreshAuth()

      const attemptedQuizzes = user.quizzesAttempted || []
      setStats({
        quizzesCreated: user.quizzesCreated ? user.quizzesCreated.length : 0,
        quizzesAttempted: attemptedQuizzes.length,
        averageScore: attemptedQuizzes.length > 0
          ? Math.round(attemptedQuizzes.reduce((acc, attempt) => {
              const score = attempt.score || 0
              return acc + (score <= 10 ? (score / 10) * 100 : score)
            }, 0) / attemptedQuizzes.length)
          : 0,
        studyStreak: 15,
      })

      if (user.quizzesCreated && user.quizzesCreated.length > 0) {
        const recentQuizIds = user.quizzesCreated.slice(-3)
        const quizPromises = recentQuizIds.map(quizId =>
          quizAPI.getQuiz(quizId).catch(err => {
            console.warn(`Failed to fetch quiz ${quizId}:`, err)
            return null
          })
        )

        const quizResponses = await Promise.all(quizPromises)
        const validQuizzes = quizResponses
          .filter(response => response && response.success)
          .map(response => response.data.safeQuiz)

        setRecentQuizzes(validQuizzes)
      } else {
        setRecentQuizzes([])
      }
    } catch (error) {
      console.error('Error refreshing dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        if (user) {
          const attemptedQuizzes = user.quizzesAttempted || []
          setStats({
            quizzesCreated: user.quizzesCreated ? user.quizzesCreated.length : 0,
            quizzesAttempted: attemptedQuizzes.length,
            averageScore: attemptedQuizzes.length > 0
              ? Math.round(attemptedQuizzes.reduce((acc, attempt) => {
                  const score = attempt.score || 0
                  return acc + (score <= 10 ? (score / 10) * 100 : score)
                }, 0) / attemptedQuizzes.length)
              : 0,
            studyStreak: 15,
          })

          if (user.quizzesCreated && user.quizzesCreated.length > 0) {
            const recentQuizIds = user.quizzesCreated.slice(-3)
            const quizPromises = recentQuizIds.map(quizId =>
              quizAPI.getQuiz(quizId).catch(err => {
                console.warn(`Failed to fetch quiz ${quizId}:`, err)
                return null
              })
            )

            const quizResponses = await Promise.all(quizPromises)
            const validQuizzes = quizResponses
              .filter(response => response && response.success)
              .map(response => response.data.safeQuiz)

            setRecentQuizzes(validQuizzes)
          } else {
            setRecentQuizzes([])
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        if (user) {
          const attemptedQuizzes = user.quizzesAttempted || []
          setStats({
            quizzesCreated: user.quizzesCreated ? user.quizzesCreated.length : 0,
            quizzesAttempted: attemptedQuizzes.length,
            averageScore: attemptedQuizzes.length > 0
              ? Math.round(attemptedQuizzes.reduce((acc, attempt) => {
                  const score = attempt.score || 0
                  return acc + (score <= 10 ? (score / 10) * 100 : score)
                }, 0) / attemptedQuizzes.length)
              : 0,
            studyStreak: 15,
          })
          setRecentQuizzes([])
        }
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user])

  if (loading) {
    return (
      <div className="pt-4 px-6 pb-6 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="pt-4 px-6 pb-6 space-y-8 min-h-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {user.name}!</h1>
          <p className="text-muted-foreground mt-2">
            Ready to continue your learning journey?
          </p>
        </div>
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <Link
            to="/create-quiz"
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Create New Quiz
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Quizzes Created</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.quizzesCreated}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Quizzes Attempted</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.quizzesAttempted}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Average Score</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.averageScore}%</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Quizzes */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Recent Quizzes</h2>
            <Link
              to="/my-quizzes"
              className="text-primary hover:text-primary/80 font-medium text-sm"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-4">
            {recentQuizzes.length > 0 ? (
              recentQuizzes.slice(0, 3).map((quiz) => (
                <div key={quiz._id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-foreground">{quiz.title}</h3>
                    <p className="text-sm text-muted-foreground">{quiz.totalQuestions} questions</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      quiz.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {quiz.status}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No quizzes yet. Create your first quiz to get started!</p>
                <Link
                  to="/create-quiz"
                  className="mt-2 inline-flex items-center text-primary hover:text-primary/80 font-medium text-sm"
                >
                  Create Quiz →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/create-quiz"
              className="flex items-center p-4 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors group"
            >
              <PlusCircle className="w-5 h-5 text-primary mr-3 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-foreground">Create New Quiz</span>
            </Link>
            <Link
              to="/my-quizzes"
              className="flex items-center p-4 bg-secondary/50 hover:bg-secondary rounded-lg transition-colors group"
            >
              <BookOpen className="w-5 h-5 text-muted-foreground mr-3 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-foreground">View My Quizzes</span>
            </Link>
            <Link
              to="/profile"
              className="flex items-center p-4 bg-secondary/50 hover:bg-secondary rounded-lg transition-colors group"
            >
              <Users className="w-5 h-5 text-muted-foreground mr-3 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-foreground">View Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
