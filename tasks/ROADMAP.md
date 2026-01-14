# QuizX - Feature Roadmap & Tasks

> Last Updated: January 14, 2026

---

## 🔴 High Priority

### User Experience
- [x] **Leaderboard System** - Global & per-quiz rankings to drive competition ✅
- [ ] **Achievements/Badges** - "Quiz Master", "Streak King", "First Win" etc.
- [ ] **Quiz Categories Browser** - Explore and discover public quizzes
- [ ] **Search & Filter** - Find quizzes by topic, difficulty, popularity

### Quiz Features
- [ ] **Timed Questions** - Add configurable time limits per question
- [ ] **Quiz Reviews** - Review wrong answers with explanations after completion
- [ ] **Edit Quizzes** - Allow users to edit/fix AI-generated questions
- [ ] **Quiz Sharing** - Generate shareable links for social media

### Engagement
- [ ] **Fix Study Streak** - Currently hardcoded to 15, needs actual daily tracking
- [ ] **Public Quiz Library** - Expose `isPublic` field in UI for community quizzes

### Technical/Security
- [ ] **Rate Limiting** - Prevent API abuse (use express-rate-limit)
- [ ] **Input Sanitization** - Protect against XSS/SQL injection attacks

---

## 🟡 Medium Priority

### User Experience
- [ ] **Progress Tracking** - Visual charts showing performance over time
- [ ] **Push Notifications** - Reminders, game invites, streak alerts
- [ ] **Social Features** - Follow friends, share results, activity feed

### Quiz Features
- [ ] **Different Question Types** - True/False, Fill-in-blank, Multiple select
- [ ] **Quiz Difficulty Auto-adjust** - Adaptive difficulty based on performance

### Multiplayer Game
- [ ] **Team Mode** - Allow players to compete in teams
- [ ] **Power-ups** - Double points, freeze timer, 50-50 elimination

### Technical
- [ ] **Error Boundaries** - Graceful UI error handling in React
- [ ] **Caching** - Redis for frequently accessed quiz data
- [ ] **PWA Support** - Offline access, installable on mobile
- [ ] **Analytics Dashboard** - Track user behavior and quiz performance

---

## 🟢 Low Priority

### Quiz Features
- [ ] **Quiz Templates** - Pre-built quiz structures for common topics
- [ ] **AI Quiz Improvements** - Better prompts, more question variety
- [ ] **Quiz Collections** - Group related quizzes into courses/playlists

### Multiplayer Game
- [ ] **Spectator Mode** - Watch live games without participating
- [ ] **Live Reactions** - Emoji reactions during multiplayer games
- [ ] **Game Replays** - Review past game sessions

### Social
- [ ] **User Profiles** - Public profiles with stats and achievements
- [ ] **Comments & Ratings** - Rate and review public quizzes
- [ ] **Challenge Friends** - Send direct quiz challenges

### Technical
- [ ] **Internationalization (i18n)** - Multi-language support
- [ ] **Accessibility (a11y)** - Screen reader support, keyboard navigation
- [ ] **Mobile App** - React Native or Flutter app

---

## 💰 Future Monetization (Optional)

- [ ] **Premium Plans** - Unlimited quizzes, advanced analytics, no ads
- [ ] **Team/Organization Plans** - For schools, companies, educators
- [ ] **Custom Branding** - White-label quizzes for businesses
- [ ] **Marketplace** - Sell premium quiz packs

---

## ✅ Completed Features

- [x] User Authentication (Login/Register)
- [x] Quiz Creation from PDF & YouTube
- [x] AI-powered question generation (Groq)
- [x] Real-time multiplayer games (Socket.io)
- [x] Dashboard with stats
- [x] Quiz hosting & playing
- [x] Dark/Light theme toggle
- [x] Email verification
- [x] Protected routes

---

## 📝 Notes

- Start with **High Priority** items for maximum impact
- The `isPublic` field already exists in quiz model - just needs UI
- Study streak tracking needs `DailyActivity` model integration
- Consider using Redis for leaderboard (sorted sets are perfect for this)

---

## 🚀 Quick Start Suggestions

1. Fix the hardcoded study streak (easy win)
2. Add quiz editing capability
3. Build the public quiz library
4. Implement basic leaderboard
5. Add explanations to results page
