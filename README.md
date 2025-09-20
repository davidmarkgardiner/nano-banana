# 🍌 Nano Banana - AI Image Generator

A modern web application for generating AI images from text prompts, built with Next.js 15, Firebase Authentication, and TypeScript.

## ✨ Features

### Current Features
- 🔥 **Firebase Authentication** - Google-only sign-in with an administrator approval workflow
- 🛡️ **Admin Approval Queue** - Every new Google login is tracked for manual approval before accessing protected tools
- 🚀 **Google OAuth** - One-click Google sign-in with Firebase
- 🗄️ **Firestore Database** - Real-time data storage and retrieval
- 🖼️ **Firebase Storage** - Save Nano Banana images directly to your bucket
- 🎨 **AI Image Generation** - Generate beautiful images from text prompts
- 🎨 **Modern UI** - Clean, responsive glassmorphic design with Tailwind CSS
- 🌙 **Dark Mode Support** - Automatic theme switching
- 📱 **Responsive Design** - Mobile-first approach that works on all devices
- 🔒 **TypeScript** - Full type safety and better developer experience

### Planned Features (In Development)
- 🎨 **AI Image Generation** - Generate images from text prompts using nano-banana API
- 💾 **Image History** - Save and manage your generated images in Firestore
- 🔄 **Real-time Updates** - Live status updates during image generation
- 📤 **Image Export** - Download and share generated images
- 🎯 **Prompt Suggestions** - Smart suggestions to improve your prompts

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Firebase account and project
- (Optional) Devbox for consistent development environment

### 1. Clone and Install

```bash
git clone <repository-url>
cd nano-banana
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Firebase Setup

1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with the Google provider (email/password is not used)
3. Create a Firestore database
4. (Optional) Create a `userApprovals` collection to track admin decisions
5. Copy your configuration to `.env.local`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with AuthProvider
│   ├── page.tsx                # Main application with image generator
│   └── globals.css             # Global styles and Tailwind imports
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx       # Authentication form component
│   │   └── UserProfile.tsx     # User profile display
│   ├── image-generation/
│   │   ├── ImageGenerator.tsx  # Main image generation interface
│   │   ├── TextPromptInput.tsx # Text input for prompts
│   │   ├── ImageDisplay.tsx    # Generated image display area
│   │   └── ImageHistory.tsx    # User's generated images history
│   └── ui/
│       ├── UserHeader.tsx      # User info and logout header
│       └── LoadingSpinner.tsx  # Reusable loading component
├── context/
│   └── AuthContext.tsx         # Firebase authentication context
├── hooks/
│   └── useImageGeneration.ts   # Custom hook for image generation logic
├── lib/
│   ├── firebase.ts             # Firebase configuration
│   ├── imageStorage.ts         # Firestore image persistence
│   └── nanoBananaAPI.ts        # API integration (placeholder)
└── types/
    └── index.ts                # TypeScript type definitions
```

## 🔧 Available Scripts

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx playwright test  # Run end-to-end tests
```

## 🎨 Image Generation Workflow

### User Journey
1. **Authentication** - Users sign in with Google and wait for admin approval
2. **Prompt Input** - Enter descriptive text for image generation
3. **Generation** - Click generate to create AI image (connects to nano-banana API)
4. **Display** - View generated image with loading states and error handling
5. **History** - Access previously generated images from Firestore

### Component Architecture
- **ImageGenerator**: Main container managing state and coordinating child components
- **TextPromptInput**: Handles user input with validation and character limits
- **ImageDisplay**: Shows generated images with loading/error states
- **ImageHistory**: Displays user's previous generations (optional feature)

## 🛠️ Development Workflow

### With TaskMaster AI Integration

This project includes TaskMaster AI for structured development:

```bash
# Initialize task management
task-master init

# View available tasks
task-master list

# Work on next task
task-master next
task-master show <task-id>

# Mark tasks complete
task-master set-status --id=<task-id> --status=done
```

### Using Devbox (Recommended)

```bash
# Enter consistent development environment
devbox shell

# Load secrets (if configured)
devbox run load-secrets

# Run security scans
devbox run scan-secrets
```

## 🔒 Security & Best Practices

### Authentication
- Firebase handles all authentication securely
- User sessions managed client-side with automatic refresh
- Protected routes ensure only authenticated users access image generation

### Data Storage
- Generated images stored in Firestore with user association
- Environment variables for all sensitive configuration
- No API keys or secrets committed to repository

### Development Security
- **detect-secrets**: Automatic scanning for committed secrets
- **Teller**: Secure secret management with Google Cloud integration
- **ESLint**: Code quality and security linting rules

## 🚀 Deployment

### Firebase Hosting (Primary)

```bash
npm run build
firebase deploy
```

### Alternative Platforms

The app is compatible with:
- **Vercel**: Zero-config deployment with GitHub integration
- **Netlify**: Static site deployment with environment variables
- **Railway**: Full-stack deployment with database support
- **AWS Amplify**: Scalable hosting with CI/CD pipeline

## 🧪 Testing

### End-to-End Testing with Playwright

```bash
# Run all tests
npx playwright test

# Run with UI for debugging
npx playwright test --ui

# Run specific test suite
npx playwright test tests/image-generation.spec.ts
```

### Test Coverage
- **Authentication flows**: Login, registration, Google OAuth
- **Image generation UI**: Input validation, loading states, error handling
- **Responsive design**: Mobile and desktop layouts
- **Firebase integration**: Database operations and file storage

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch: `git checkout -b feature/image-generation-ui`
3. Follow the component structure in `/src/components/`
4. Add tests for new functionality
5. Submit pull request with TaskMaster task references

### Code Standards
- **TypeScript**: Strict mode enabled, full type coverage
- **Component Structure**: Functional components with hooks
- **Styling**: Tailwind CSS with consistent dark mode support
- **Testing**: Playwright for E2E, component tests where needed

## 📚 API Integration (Coming Soon)

### Nano Banana API Structure
```typescript
interface NanoBananaAPI {
  generateImage(prompt: string): Promise<{
    imageUrl: string
    id: string
    metadata: ImageMetadata
  }>
}

interface ImageMetadata {
  prompt: string
  generatedAt: Date
  model: string
  dimensions: { width: number; height: number }
}
```

## 🔧 Environment Variables

Required environment variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Future: Nano Banana API
# NANO_BANANA_API_KEY=
# NANO_BANANA_BASE_URL=
```

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Troubleshooting

### Common Issues

**Firebase Connection**: Check environment variables in `.env.local`
```bash
# Verify Firebase connection
npm run dev
# Look for "Firebase connected and ready!" message
```

**Build Errors**: Run type checking
```bash
npm run build
# Check for TypeScript errors in components
```

**Authentication Issues**: Verify Firebase Console settings
- Authorized domains configured correctly
- Authentication providers enabled
- Web app configuration matches `.env.local`

---

**Ready to generate some amazing AI images!** 🎨🍌