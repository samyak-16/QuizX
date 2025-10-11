import { User, Mail, Calendar, Award, BookOpen, TrendingUp, Edit } from 'lucide-react'
import { useState, useEffect } from 'react'
import { authAPI } from '../services/api.js'

const Profile = () => {
  const [user, setUser] = useState(null)
  const [userQuizzes, setUserQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch user profile
        const profileResponse = await authAPI.getProfile()
        if (profileResponse.success) {
          setUser(profileResponse.data)
        }

        // Fetch user quizzes (optional - for additional stats)
        try {
          const quizzesResponse = await authAPI.getUserQuizzes()
          if (quizzesResponse.success) {
            setUserQuizzes(quizzesResponse.data)
          }
        } catch (quizError) {
          // User quizzes fetch is optional, so we don't fail the entire profile load
          console.warn('Failed to fetch user quizzes:', quizError)
        }
      } catch (err) {
        setError('Failed to load profile data')
        console.error('Profile fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [refreshTrigger])

  // Calculate stats from user data
  const stats = user ? {
    quizzesCreated: user.quizzesCreated ? user.quizzesCreated.length : 0,
    quizzesAttempted: user.quizzesAttempted ? user.quizzesAttempted.length : 0,
    averageScore: user.quizzesAttempted && user.quizzesAttempted.length > 0
      ? Math.round(user.quizzesAttempted.reduce((acc, attempt) => {
          // Handle different score formats - if score is already a percentage, use it directly
          const score = attempt.score || 0
          return acc + (score <= 10 ? (score / 10) * 100 : score) // Convert 0-10 scale to percentage, or use as-is if already percentage
        }, 0) / user.quizzesAttempted.length)
      : 0,
    studyStreak: 15, // This would need to be calculated based on consecutive days of activity
    joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown'
  } : {
    quizzesCreated: 0,
    quizzesAttempted: 0,
    averageScore: 0,
    studyStreak: 0,
    joinDate: 'Unknown'
  }

  // Generate recent activity from user data with quiz names
  const recentActivity = user?.quizzesAttempted ? user.quizzesAttempted
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, 4)
    .map(attempt => {
      // Handle different score formats for display
      const score = attempt.score || 0
      const displayScore = score <= 10 ? `${Math.round((score / 10) * 100)}%` : `${Math.round(score)}%`

      return {
        action: 'Completed quiz',
        title: `Quiz #${attempt.quiz?.slice(-8) || 'Unknown'}`, // Show quiz ID for now since we don't have title lookup
        score: displayScore,
        time: attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString() : 'Unknown'
      }
    }) : []

  // Generate achievements based on user stats
  const achievements = [
    {
      title: 'First Quiz Creator',
      description: stats.quizzesCreated > 0 ? 'Created your first quiz' : 'Create your first quiz',
      icon: '🏆',
      unlocked: stats.quizzesCreated > 0
    },
    {
      title: 'Score Master',
      description: 'Achieved 90%+ on 5 quizzes',
      icon: '⭐',
      unlocked: stats.averageScore >= 90
    },
    {
      title: 'Study Streak',
      description: '15 days learning streak',
      icon: '🔥',
      unlocked: stats.studyStreak >= 15
    },
    {
      title: 'Knowledge Seeker',
      description: 'Attempted 25+ quizzes',
      icon: '📚',
      unlocked: stats.quizzesAttempted >= 25
    },
  ]

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Profile</h2>
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

  if (!user) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">No Profile Data</h2>
          <p className="text-muted-foreground">Unable to load profile information.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-4 px-6 pb-6 max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-primary" />
                )}
              </div>
              <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
              <p className="text-muted-foreground">{user.email}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-sm">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <span className="text-muted-foreground">Joined {stats.joinDate}</span>
              </div>
              <button className="w-full flex items-center justify-center px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Stats and Activity */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stats */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-xl font-semibold text-foreground mb-6">Learning Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <BookOpen className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{stats.quizzesCreated}</div>
                <div className="text-sm text-muted-foreground">Created</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{stats.quizzesAttempted}</div>
                <div className="text-sm text-muted-foreground">Attempted</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Award className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{stats.averageScore}%</div>
                <div className="text-sm text-muted-foreground">Average Score</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-orange-600 font-bold">🔥</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{stats.studyStreak}</div>
                <div className="text-sm text-muted-foreground">Day Streak</div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-xl font-semibold text-foreground mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {activity.action}: {activity.title}
                    </p>
                    {activity.score && (
                      <p className="text-sm text-green-600 font-semibold">{activity.score}</p>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">{activity.time}</div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-xl font-semibold text-foreground mb-6">Achievements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement, index) => (
                <div key={index} className={`flex items-start space-x-3 p-4 rounded-lg ${
                  achievement.unlocked ? 'bg-green-50 border border-green-200' : 'bg-muted/50'
                }`}>
                  <div className="text-2xl">{achievement.icon}</div>
                  <div>
                    <h4 className={`font-medium ${achievement.unlocked ? 'text-green-800' : 'text-foreground'}`}>
                      {achievement.title}
                    </h4>
                    <p className={`text-sm ${achievement.unlocked ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {achievement.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
