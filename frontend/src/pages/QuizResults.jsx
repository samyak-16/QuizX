import { useEffect } from 'react'
import { useLocation, useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Trophy, Target, Clock, TrendingUp, RotateCcw, CheckCircle, XCircle } from 'lucide-react'

const QuizResults = () => {
  const location = useLocation()
  const { id: quizId } = useParams()
  const { refreshUser } = useAuth()

  // Get results data from navigation state
  const { score, total, results } = location.state || {}

  // Refresh user data when quiz is completed
  useEffect(() => {
    if (refreshUser) {
      refreshUser()
    }
  }, [refreshUser])

  // If no results data, redirect to dashboard
  if (!score || !total || !results) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Results Not Found</h2>
          <p className="text-muted-foreground mb-4">No quiz results available.</p>
          <Link
            to="/dashboard"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const percentage = Math.round((score / total) * 100)
  const passed = percentage >= 70 // Assuming 70% is passing

  // Calculate time spent (mock calculation - in real app this would come from backend)
  const timeSpent = '15:30'

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
          passed ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {passed ? (
            <Trophy className="w-10 h-10 text-green-600" />
          ) : (
            <Target className="w-10 h-10 text-red-600" />
          )}
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {passed ? 'Quiz Passed!' : 'Quiz Completed'}
        </h1>
        <p className="text-muted-foreground">
          Quiz Results
        </p>
      </div>

      {/* Score Overview */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <div className={`text-3xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-600'}`}>
            {percentage}%
          </div>
          <div className="text-sm text-muted-foreground">Final Score</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">{score}/{total}</div>
          <div className="text-sm text-muted-foreground">Correct Answers</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{timeSpent}</div>
          <div className="text-sm text-muted-foreground">Time Spent</div>
        </div>
      </div>

      {/* Question Review */}
      <div className="bg-card border border-border rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">Question Review</h2>
        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={result.questionId} className="p-4 border border-border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-medium text-foreground mb-1">
                    Question {index + 1}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {result.questionText}
                  </p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-muted-foreground">
                      Your answer: <span className={result.isCorrect ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {result.userAnswer || 'Not answered'}
                      </span>
                    </span>
                    {!result.isCorrect && (
                      <span className="text-green-600">
                        Correct: {result.correctAnswer}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  {result.isCorrect ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                </div>
              </div>
              {result.explanation && (
                <div className="mt-2 p-2 bg-muted/50 rounded text-sm text-muted-foreground">
                  {result.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
        >
          Back to Dashboard
        </Link>
        <Link
          to={`/quiz/${quizId}`}
          className="inline-flex items-center justify-center px-6 py-3 border border-border text-foreground rounded-lg hover:bg-muted transition-colors font-semibold"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Retake Quiz
        </Link>
        <Link
          to="/create-quiz"
          className="inline-flex items-center justify-center px-6 py-3 border border-border text-foreground rounded-lg hover:bg-muted transition-colors font-semibold"
        >
          Create New Quiz
        </Link>
      </div>
    </div>
  )
}

export default QuizResults
