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
- 🤖 **AI Assistant Chatbot** - Built-in helper that can answer questions using the repo knowledge base, optional web search, and file GitHub issues for bugs or feedback

### Planned Features (In Development)
- 🎨 **AI Image Generation** - Generate images from text prompts using nano-banana API
- 🎥 **AI Video Generation (Veo)** - Generate short cinematic clips with aspect/duration controls (beta)
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

Edit `.env.local` with your Firebase credentials and deployment settings:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_ADMIN_EMAILS=admin1@example.com,admin2@example.com
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_USE_REAL_API=false
NEXT_PUBLIC_APP_URL=https://your-vercel-project-url.vercel.app
# Optional: Configure the chatbot assistant
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
# Or use Anthropic instead of OpenAI
ANTHROPIC_API_KEY=your_anthropic_api_key
ANTHROPIC_MODEL=claude-3-sonnet-20240229
# Optional: Enable GitHub issue creation from the chatbot
GITHUB_TOKEN=github_pat_goes_here
GITHUB_OWNER=your-github-username-or-org
GITHUB_REPO=your-repo-name
# Video (Veo) generation
GEMINI_VIDEO_MODEL=veo-3.1-generate-preview
GEMINI_VIDEO_TIMEOUT_MS=90000
```

### 2.1 Configure the Chatbot Assistant

The floating 🤖 **Nano Assistant** helps users navigate the site and escalate problems. To enable it:

1. Provide either an `OPENAI_API_KEY` or an `ANTHROPIC_API_KEY` (you can set both and the server will fall back automatically).
2. Optionally override `OPENAI_MODEL` or `ANTHROPIC_MODEL` if you want to target a specific model family.
3. (Optional) Supply `GITHUB_TOKEN`, `GITHUB_OWNER`, and `GITHUB_REPO` so bug reports and feedback from the issue tab are published as GitHub issues.

> ℹ️ The assistant can ground answers with repository context or perform a quick DuckDuckGo web lookup. Missing credentials will surface friendly messages in the UI instead of failing silently.

### 3. Firebase Setup

1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with the Google provider (email/password is not used)
3. Create a Firestore database
4. Define your administrator allow-list:
   - Update `NEXT_PUBLIC_FIREBASE_ADMIN_EMAILS` in `.env.local` with the lowercase emails that should auto-approve
   - Mirror the same addresses inside [`firestore.rules`](firestore.rules) so only trusted admins can approve accounts
5. Copy your configuration to `.env.local`

> ℹ️ The app automatically creates a `userApprovals` document the first time a user signs in. Change its `status` to `approved` from the Firebase Console to unlock the protected areas of the app.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## ☁️ Deploy to Vercel

The project ships with a ready-to-use [`vercel.json`](vercel.json) configuration and a curated [deployment guide](docs/deployment/vercel.md).

1. [Create or log in to a Vercel account](https://vercel.com/).
2. Import this repository from your Git provider. Vercel will auto-detect the Next.js framework and suggested build settings.
3. Add the environment variables from `.env.local` (see table in the deployment guide). Include `NEXT_PUBLIC_APP_URL` with your production domain and enable `NEXT_PUBLIC_USE_REAL_API=true` only when your Gemini API key is active.
4. Deploy the project. Vercel will provide a preview URL and, once promoted, a production domain.
5. Optionally deploy via the Vercel CLI (`vercel --prod`) to trigger new builds from your terminal.

> ℹ️ The [`.vercelignore`](.vercelignore) file keeps local tooling assets and large screenshots out of your deployment bundle. Customize it if you need to ship additional static assets.

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

### Video Generation Workflow (Beta)
- **Model**: Veo (`GEMINI_VIDEO_MODEL`, default `veo-3.1-generate-preview`) with UI model picker (3.1 preview, 3.0, 3.0 lite).
- **Inputs**: Prompt (3–500 chars), aspect ratio 16:9 or 9:16, duration 4/6/8s, resolution 720p (1080p only when 16:9 + 8s), optional negative prompt, optional people toggle.
- **API**: `POST /api/generate-video` polls Gemini operations until ready and returns a downloadable video URL plus metadata.
- **UI**: Video panel in the canvas with progress hints, playback, and download link; supports using the current canvas image as a reference (auto-enforces 16:9 + 8s); mock-friendly when `NEXT_PUBLIC_USE_REAL_API=false`.
- **Storage**: When signed in, generated videos auto-save to Firebase Storage under `nano-banana-videos/<uid>/...`.

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

**Ready to generate some amazing AI images!** 🎨🍌# Deployment trigger Sat Sep 20 19:57:22 BST 2025
