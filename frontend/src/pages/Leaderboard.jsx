import { useState, useEffect } from 'react'
import { Trophy, Medal, Crown, TrendingUp, Calendar, User, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { leaderboardAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const Leaderboard = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('global')
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userRank, setUserRank] = useState(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasMore: false,
  })

  const tabs = [
    { id: 'global', label: 'All Time', icon: Trophy },
    { id: 'weekly', label: 'This Week', icon: Calendar },
  ]

  useEffect(() => {
    fetchLeaderboard()
    if (user) {
      fetchUserRank()
    }
  }, [activeTab, pagination.currentPage])

  const fetchLeaderboard = async () => {
    setLoading(true)
    setError(null)
    try {
      let response
      if (activeTab === 'global') {
        response = await leaderboardAPI.getGlobalLeaderboard(pagination.currentPage, 20)
      } else if (activeTab === 'weekly') {
        response = await leaderboardAPI.getWeeklyLeaderboard(50)
      }

      if (response.success) {
        setLeaderboard(response.data.leaderboard)
        if (response.data.pagination) {
          setPagination(response.data.pagination)
        }
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
      setError('Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserRank = async () => {
    try {
      const response = await leaderboardAPI.getMyRank()
      if (response.success) {
        setUserRank(response.data)
      }
    } catch (err) {
      console.error('Error fetching user rank:', err)
    }
  }

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />
    return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>
  }

  const getRankBgColor = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/30'
    if (rank === 2) return 'bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/30'
    if (rank === 3) return 'bg-gradient-to-r from-amber-600/20 to-amber-700/10 border-amber-600/30'
    return 'bg-card border-border'
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }))
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Trophy className="w-8 h-8 text-primary" />
          Leaderboard
        </h1>
        <p className="text-muted-foreground mt-2">
          See how you stack up against other quiz masters
        </p>
      </div>

      {/* User's Rank Card */}
      {user && userRank && (
        <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-primary-foreground" />
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">Your Ranking</p>
                <p className="text-sm text-muted-foreground">{user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">#{userRank.rank}</p>
                <p className="text-xs text-muted-foreground">Rank</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{userRank.totalScore}</p>
                <p className="text-xs text-muted-foreground">Total Score</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{userRank.quizzesAttempted}</p>
                <p className="text-xs text-muted-foreground">Quizzes</p>
              </div>
              <div className="hidden sm:block">
                <p className="text-2xl font-bold text-green-500">Top {userRank.percentile}%</p>
                <p className="text-xs text-muted-foreground">Percentile</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              setPagination(prev => ({ ...prev, currentPage: 1 }))
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive">{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No rankings yet. Be the first to take a quiz!</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium (only on first page of global) */}
          {activeTab === 'global' && pagination.currentPage === 1 && leaderboard.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {/* Second Place */}
              <div className="flex flex-col items-center pt-8">
                <div className="relative">
                  <div className="w-16 h-16 bg-gray-400/20 rounded-full flex items-center justify-center border-2 border-gray-400">
                    {leaderboard[1]?.avatar ? (
                      <img src={leaderboard[1].avatar} alt={leaderboard[1].name} className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    2
                  </div>
                </div>
                <p className="mt-4 font-semibold text-foreground text-center truncate max-w-full">{leaderboard[1]?.name}</p>
                <p className="text-sm text-muted-foreground">{leaderboard[1]?.totalScore} pts</p>
              </div>

              {/* First Place */}
              <div className="flex flex-col items-center">
                <Crown className="w-8 h-8 text-yellow-500 mb-2" />
                <div className="relative">
                  <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center border-2 border-yellow-500">
                    {leaderboard[0]?.avatar ? (
                      <img src={leaderboard[0].avatar} alt={leaderboard[0].name} className="w-20 h-20 rounded-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-yellow-500" />
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    1
                  </div>
                </div>
                <p className="mt-4 font-semibold text-foreground text-center truncate max-w-full">{leaderboard[0]?.name}</p>
                <p className="text-sm text-yellow-500 font-medium">{leaderboard[0]?.totalScore} pts</p>
              </div>

              {/* Third Place */}
              <div className="flex flex-col items-center pt-12">
                <div className="relative">
                  <div className="w-14 h-14 bg-amber-600/20 rounded-full flex items-center justify-center border-2 border-amber-600">
                    {leaderboard[2]?.avatar ? (
                      <img src={leaderboard[2].avatar} alt={leaderboard[2].name} className="w-14 h-14 rounded-full object-cover" />
                    ) : (
                      <User className="w-7 h-7 text-amber-600" />
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    3
                  </div>
                </div>
                <p className="mt-4 font-semibold text-foreground text-center truncate max-w-full">{leaderboard[2]?.name}</p>
                <p className="text-sm text-muted-foreground">{leaderboard[2]?.totalScore} pts</p>
              </div>
            </div>
          )}

          {/* Full Leaderboard List */}
          <div className="space-y-2">
            {leaderboard.map((entry, index) => {
              const isCurrentUser = user && entry.userId === user._id
              const rank = entry.rank || index + 1
              
              return (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    isCurrentUser
                      ? 'bg-primary/10 border-primary/30 ring-1 ring-primary/20'
                      : getRankBgColor(rank)
                  }`}
                >
                  {/* Rank */}
                  <div className="w-10 flex items-center justify-center">
                    {getRankIcon(rank)}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                    {entry.avatar ? (
                      <img src={entry.avatar} alt={entry.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                      {entry.name}
                      {isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activeTab === 'global' 
                        ? `${entry.quizzesCount} quizzes • Avg: ${entry.averageScore}%`
                        : `${entry.weeklyQuizzes} quizzes this week`
                      }
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <p className={`text-lg font-bold ${rank <= 3 ? 'text-primary' : 'text-foreground'}`}>
                      {activeTab === 'global' ? entry.totalScore : entry.weeklyScore}
                    </p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {activeTab === 'global' && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="p-2 rounded-lg bg-card border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasMore}
                className="p-2 rounded-lg bg-card border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Leaderboard
