import { Link } from 'react-router-dom'
import { BookOpen, Brain, Zap, Users, ArrowRight } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'

const Home = () => {
  const { theme } = useTheme()
  const { user } = useAuth() // get user auth state

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Generation',
      description: 'Create quizzes automatically from PDFs and YouTube videos using advanced AI technology.',
    },
    {
      icon: BookOpen,
      title: 'Smart Learning',
      description: 'Interactive quizzes that adapt to help you learn more effectively.',
    },
    {
      icon: Zap,
      title: 'Instant Results',
      description: 'Get immediate feedback and detailed explanations for every answer.',
    },
    {
      icon: Users,
      title: 'Collaborative Platform',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="relative z-10 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">Q</span>
            </div>
            <span className="text-2xl font-bold text-foreground">QuizX</span>
          </Link>
          <div className="flex items-center space-x-4">
            {user ? (
              <Link
                to="/dashboard"
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
              Master Any Subject with{' '}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                AI-Powered Quizzes
              </span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Transform your learning experience with intelligent quizzes generated from PDFs, YouTube videos, and more.
              Study smarter, not harder.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 font-semibold text-lg group"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 font-semibold text-lg group"
                  >
                    Start Learning Now
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center px-8 py-4 border border-border text-foreground rounded-xl hover:bg-muted transition-all duration-200 font-semibold text-lg"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Floating visual elements */}
          <div className="absolute top-1/4 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-pulse hidden lg:block"></div>
          <div className="absolute top-1/3 right-10 w-32 h-32 bg-secondary/10 rounded-full blur-xl animate-pulse delay-1000 hidden lg:block"></div>
        </div>
      </section>

        {/* Features Section */}
        <section className="px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Why Choose QuizX?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Experience the future of learning with our cutting-edge features designed to maximize your potential.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
      
      </section>

      {/* Stats Section */}
      <section className="px-6 py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">10K+</div>
              <div className="text-muted-foreground">Quizzes Created</div>
            </div>
            <div>
              <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">50K+</div>
              <div className="text-muted-foreground">Questions Generated</div>
            </div>
            <div>
              <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">95%</div>
              <div className="text-muted-foreground">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">AI Availability</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 lg:p-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of learners who are already experiencing the power of AI-driven education.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 font-semibold text-lg group"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-border">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">Q</span>
            </div>
            <span className="text-xl font-bold text-foreground">QuizX</span>
          </div>
          <p className="text-muted-foreground">
            © 2024 QuizX. Built with AI for smarter learning.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Home
