import { Upload, Youtube, FileText, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { quizAPI } from '../services/api.js'

const CreateQuiz = () => {
  const [formData, setFormData] = useState({
    title: '',
    sourceType: '',
    youtubeUrl: '',
    difficulty: '',
    file: null
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState('')
  const [errors, setErrors] = useState({})

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        setErrors(prev => ({
          ...prev,
          file: 'Please select a PDF file only'
        }))
        return
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setErrors(prev => ({
          ...prev,
          file: 'File size must be less than 10MB'
        }))
        return
      }
      setFormData(prev => ({
        ...prev,
        file,
        sourceType: 'pdf'
      }))
      setErrors(prev => ({
        ...prev,
        file: ''
      }))
    }
  }

  const handleYouTubeSubmit = () => {
    setFormData(prev => ({
      ...prev,
      sourceType: 'youtube'
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Quiz title is required'
    }

    if (!formData.sourceType) {
      newErrors.sourceType = 'Please select a source type'
    }

    if (!formData.difficulty) {
      newErrors.difficulty = 'Please select difficulty level'
    }

    if (formData.sourceType === 'youtube' && !formData.youtubeUrl.trim()) {
      newErrors.youtubeUrl = 'YouTube URL is required'
    }

    if (formData.sourceType === 'pdf' && !formData.file) {
      newErrors.file = 'Please select a PDF file'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsProcessing(true)
    setProcessingStatus('Creating quiz...')

    try {
      const submitData = new FormData()
      submitData.append('title', formData.title)
      submitData.append('sourceType', formData.sourceType)
      submitData.append('difficulty', formData.difficulty)

      if (formData.sourceType === 'youtube') {
        submitData.append('youtubeUrl', formData.youtubeUrl)
      }

      if (formData.sourceType === 'pdf' && formData.file) {
        submitData.append('pdf', formData.file)
      }

      const response = await quizAPI.createQuiz(submitData)

      if (response.success) {
        setProcessingStatus('Quiz created successfully! AI is processing your content...')
        // Reset form after successful creation
        setFormData({
          title: '',
          sourceType: '',
          youtubeUrl: '',
          difficulty: '',
          file: null
        })
        setErrors({})

        // Show success message for a few seconds then redirect to dashboard
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 2000)
      } else {
        throw new Error(response.message || 'Failed to create quiz')
      }
    } catch (error) {
      console.error('Quiz creation error:', error)
      setProcessingStatus('Error creating quiz. Please try again.')
      setErrors({
        submit: error.response?.data?.message || error.message || 'Failed to create quiz'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      sourceType: '',
      youtubeUrl: '',
      difficulty: '',
      file: null
    })
    setErrors({})
    setProcessingStatus('')
  }

  return (
    <div className="pt-4 px-6 pb-6 max-w-4xl mx-auto min-h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Create New Quiz</h1>
        <p className="text-muted-foreground">
          Generate intelligent quizzes from PDFs or YouTube videos using AI
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Quiz Title */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            Quiz Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.title ? 'border-red-500' : 'border-border'
            }`}
            placeholder="Enter a descriptive title for your quiz"
            disabled={isProcessing}
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        {/* Difficulty Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            Difficulty Level *
          </label>
          <div className="flex gap-4">
            {['easy', 'medium', 'hard'].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => handleInputChange('difficulty', level)}
                disabled={isProcessing}
                className={`px-6 py-3 rounded-lg border-2 capitalize transition-colors ${
                  formData.difficulty === level
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          {errors.difficulty && <p className="text-red-500 text-sm mt-1">{errors.difficulty}</p>}
        </div>

        {/* Source Type Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-foreground mb-4">
            Choose Content Source *
          </label>

          <div className="grid md:grid-cols-2 gap-8">
            {/* PDF Upload */}
            <div className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              formData.sourceType === 'pdf' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isProcessing}
              />
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Upload PDF</h3>
              <p className="text-muted-foreground mb-6">
                Upload a PDF document and our AI will generate relevant quiz questions
              </p>
              {formData.file && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-sm font-medium">Selected: {formData.file.name}</p>
                </div>
              )}
              {errors.file && <p className="text-red-500 text-sm mt-2">{errors.file}</p>}
              <p className="text-xs text-muted-foreground">
                Supports PDF files up to 10MB
              </p>
            </div>

            {/* YouTube URL */}
            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              formData.sourceType === 'youtube' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Youtube className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">YouTube Video</h3>
              <p className="text-muted-foreground mb-6">
                Paste a YouTube URL and get quiz questions based on the video content
              </p>
              <input
                type="url"
                value={formData.youtubeUrl}
                onChange={(e) => handleInputChange('youtubeUrl', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent mb-4 ${
                  errors.youtubeUrl ? 'border-red-500' : 'border-border'
                }`}
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={isProcessing}
              />
              {errors.youtubeUrl && <p className="text-red-500 text-sm mb-2">{errors.youtubeUrl}</p>}
              <p className="text-xs text-muted-foreground">
                Works with educational videos
              </p>
            </div>
          </div>
          {errors.sourceType && <p className="text-red-500 text-sm mt-2">{errors.sourceType}</p>}
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 mb-8">
          <button
            type="submit"
            disabled={isProcessing || !formData.title || !formData.sourceType || !formData.difficulty}
            className="flex-1 px-6 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating Quiz...
              </>
            ) : (
              'Create Quiz'
            )}
          </button>

          <button
            type="button"
            onClick={resetForm}
            className="px-6 py-4 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
            disabled={isProcessing}
          >
            Reset
          </button>
        </div>

        {/* Processing Status */}
        {processingStatus && (
          <div className={`p-4 rounded-lg mb-6 ${
            processingStatus.includes('Error')
              ? 'bg-red-50 border border-red-200 text-red-800'
              : processingStatus.includes('successfully')
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            <p className="font-medium">{processingStatus}</p>
          </div>
        )}

        {/* Error Display */}
        {errors.submit && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 mb-6">
            <p className="font-medium">Error:</p>
            <p>{errors.submit}</p>
          </div>
        )}
      </form>
    </div>
  )
}

export default CreateQuiz
