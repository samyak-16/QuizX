import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, PlusCircle, Clock, Users, Eye, Play } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { quizAPI } from '../services/api'

const MyQuizzes = () => {
  const { user } = useAuth()
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [loadingProgress, setLoadingProgress] = useState(0)

  useEffect(() => {
    const fetchMyQuizzes = async () => {
      try {
        setLoading(true)
        setError(null)
        setLoadingProgress(0)

        if (user?.quizzesCreated && user.quizzesCreated.length > 0) {
          const totalQuizzes = user.quizzesCreated.length
          setLoadingProgress(10) // Initial progress

          // Fetch details for each quiz with progress tracking
          const quizPromises = user.quizzesCreated.map(async (quizId, index) => {
            try {
              const response = await quizAPI.getQuiz(quizId)
              // Update progress as each quiz loads
              setLoadingProgress(10 + Math.round((index / totalQuizzes) * 80))
              return response
            } catch (err) {
              console.warn(`Failed to fetch quiz ${quizId}:`, err)
              // Update progress even for failed requests
              setLoadingProgress(10 + Math.round((index / totalQuizzes) * 80))
              return null
            }
          })

          const quizResponses = await Promise.all(quizPromises)
          setLoadingProgress(90) // Almost done

          const validQuizzes = quizResponses
            .filter(response => response && response.success)
            .map(response => response.data.safeQuiz)

          setQuizzes(validQuizzes)
          setLoadingProgress(100) // Complete
        } else {
          setQuizzes([])
          setLoadingProgress(100)
        }
      } catch (err) {
        setError('Failed to load your quizzes')
        console.error('Quizzes fetch error:', err)
        setLoadingProgress(0)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchMyQuizzes()
    }
  }, [user])

  if (loading) {
    return (
      <div className="pt-4 px-6 pb-6 max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <div className="text-center">
            <p className="text-lg font-medium text-foreground mb-2">
              Loading your quizzes...
            </p>
            {user?.quizzesCreated && user.quizzesCreated.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {loadingProgress}% complete • {user.quizzesCreated.length} quizzes found
              </p>
            )}
            <div className="w-64 mt-4 bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="pt-4 px-6 pb-6 max-w-6xl mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Quizzes</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-4 px-6 pb-6 max-w-6xl mx-auto min-h-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Quizzes</h1>
          <p className="text-muted-foreground mt-2">
            Manage and view all your created quizzes
          </p>
        </div>
        <Link
          to="/create-quiz"
          className="mt-4 lg:mt-0 inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Create New Quiz
        </Link>
      </div>

      {/* Quizzes Grid */}
      {quizzes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div key={quiz._id} className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">
                    {quiz.title}
                  </h3>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{quiz.totalQuestions} questions</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    quiz.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {quiz.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="w-4 h-4 mr-1" />
                  <span>0 attempts</span>
                </div>

                <div className="flex space-x-2">
                  <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <Link
                    to={`/quiz/${quiz._id}`}
                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <Play className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No quizzes yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            You haven't created any quizzes yet. Create your first quiz to get started and share knowledge with others.
          </p>
          <Link
            to="/create-quiz"
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Create Your First Quiz
          </Link>
        </div>
      )}
    </div>
  )
}

export default MyQuizzes
