'use client'

import { User } from 'firebase/auth'
import { useImageGeneration } from '@/hooks/useImageGeneration'
import TextPromptInput from '@/components/TextPromptInput'
import ImageDisplay from '@/components/ImageDisplay'
import UserHeader from '@/components/UserHeader'

interface ImageGeneratorProps {
  user: User
  onLogout: () => Promise<void>
}

export default function ImageGenerator({ user, onLogout }: ImageGeneratorProps) {
  const {
    prompt,
    setPrompt,
    generatedImage,
    isLoading,
    error,
    generateImage,
    clearError,
    reset
  } = useImageGeneration()

  const handleRetry = () => {
    clearError()
    generateImage()
  }

  const handleClear = () => {
    reset()
  }

  return (
    <div className="w-full min-h-screen">
      {/* User Header */}
      <UserHeader user={user} onLogout={onLogout} />
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="space-y-8">
          {/* Title Section */}
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Create Your AI Image
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Describe what you want to see, and our AI will generate a unique image for you. 
              Be creative and specific for the best results!
            </p>
          </div>

          {/* Input Section */}
          <div className="flex justify-center">
            <TextPromptInput
              value={prompt}
              onChange={setPrompt}
              onSubmit={generateImage}
              isLoading={isLoading}
              error={error}
            />
          </div>

          {/* Image Display Section */}
          <div className="flex justify-center">
            <ImageDisplay
              imageUrl={generatedImage}
              isLoading={isLoading}
              error={error}
              prompt={prompt}
              onRetry={handleRetry}
              onClear={handleClear}
            />
          </div>

          {/* Quick Tips Section */}
          {!generatedImage && !isLoading && (
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-blue-600 dark:text-blue-400 mb-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Be Descriptive</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Include colors, lighting, mood, and style details for better results.
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="text-purple-600 dark:text-purple-400 mb-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-purple-900 dark:text-purple-100 mb-1">Try Examples</h3>
                  <p className="text-sm text-purple-800 dark:text-purple-200">
&quot;A magical forest with glowing mushrooms and fairy lights at night&quot;
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800 md:col-span-2 lg:col-span-1">
                  <div className="text-green-600 dark:text-green-400 mb-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-green-900 dark:text-green-100 mb-1">Quick Generate</h3>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Use ⌘+Enter (Mac) or Ctrl+Enter (PC) to generate quickly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {generatedImage && !isLoading && !error && (
            <div className="max-w-2xl mx-auto text-center">
              <div className="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg border border-green-200 dark:border-green-700">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Image generated successfully!</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Hover over the image to download or create a new one with a different prompt.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}