import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Clock, CheckCircle, Loader2 } from 'lucide-react'
import { quizAPI } from '../services/api'

const TakeQuiz = () => {
  const { id: quizId } = useParams()
  const navigate = useNavigate()

  const [quiz, setQuiz] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true)
        const response = await quizAPI.getQuiz(quizId)
        if (response.success) {
          setQuiz(response.data.safeQuiz)
          // Set timer for 30 minutes (1800 seconds)
          setTimeRemaining(1800)
        } else {
          throw new Error(response.message || 'Failed to load quiz')
        }
      } catch (error) {
        console.error('Error fetching quiz:', error)
        alert('Failed to load quiz. Please try again.')
        navigate('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    if (quizId) {
      fetchQuiz()
    }
  }, [quizId, navigate])

  useEffect(() => {
    if (timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmitQuiz() // Auto-submit when time runs out
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining])

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmitQuiz = async () => {
    if (submitting) return

    setSubmitting(true)
    try {
      // Convert answers to the format expected by backend
      const submissionData = {
        quizId,
        answers: Object.entries(answers).map(([questionId, userAnswer]) => ({
          questionId,
          userAnswer
        }))
      }

      const response = await quizAPI.submitQuiz(submissionData)
      if (response.success) {
        navigate(`/quiz/${quizId}/results`, {
          state: {
            score: response.data.score,
            total: response.data.total,
            results: response.data.results
          }
        })
      } else {
        throw new Error(response.message || 'Failed to submit quiz')
      }
    } catch (error) {
      console.error('Error submitting quiz:', error)
      alert('Failed to submit quiz. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Quiz Not Found</h2>
          <p className="text-muted-foreground mb-4">The quiz you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const currentQuestion = quiz.questions && quiz.questions[currentQuestionIndex]
  const progress = quiz.questions ? ((currentQuestionIndex + 1) / quiz.questions.length) * 100 : 0

  // If current question doesn't exist, show error
  if (!currentQuestion) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-orange-600 mb-4">Quiz Processing</h2>
          <p className="text-muted-foreground mb-4">
            {quiz.questions && quiz.questions.length === 0
              ? "This quiz is still being processed by AI. Please wait a few moments and refresh the page."
              : "The quiz questions are not available yet. Please try again later."
            }
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-foreground">{quiz.title}</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Clock className="w-5 h-5" />
              <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-card border border-border rounded-xl p-8 mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-6">
          {currentQuestion?.questionText || 'Question not available'}
        </h2>

        <div className="space-y-4">
          {currentQuestion?.options?.map((option, index) => {
            const optionId = String.fromCharCode(97 + index) // a, b, c, d
            return (
              <label
                key={optionId}
                className="flex items-center p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion?._id}`}
                  value={option}
                  checked={answers[currentQuestion?._id] === option}
                  onChange={() => handleAnswerSelect(currentQuestion?._id, option)}
                  className="w-4 h-4 text-primary bg-background border-border focus:ring-primary"
                />
                <span className="ml-3 text-foreground">{option}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-3 border border-border text-foreground rounded-lg hover:bg-muted transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <div className="flex space-x-3">
          <button
            onClick={handleNext}
            disabled={currentQuestionIndex === (quiz?.questions?.length || 0) - 1}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
          <button
            onClick={handleSubmitQuiz}
            disabled={submitting}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Submit Quiz
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TakeQuiz
