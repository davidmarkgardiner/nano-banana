# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common Development Commands

### Core Next.js Development
```bash
# Development server (runs on localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

### Testing Commands
```bash
# Run all Playwright tests
npx playwright test

# Run tests with UI
npx playwright test --ui

# Run specific test file
npx playwright test tests/firebase-setup.spec.ts

# Run tests in debug mode
npx playwright test --debug

# Generate test report
npx playwright show-report
```

### Firebase Commands
```bash
# Deploy to Firebase hosting
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Start Firebase emulators
firebase emulators:start

# Set Firebase project
firebase use default
```

### Development Environment
```bash
# Setup environment (copy and edit with your Firebase config)
cp .env.example .env.local

# Load development environment with Devbox
devbox shell

# Load secrets using Teller (if configured)
devbox run load-secrets

# Security scan for secrets
devbox run scan-secrets
```

### TaskMaster Integration
```bash
# Initialize TaskMaster in project
task-master init

# Parse project requirements document
task-master parse-prd .taskmaster/docs/prd.txt

# Show all tasks
task-master list

# Get next available task
task-master next

# Show specific task details
task-master show <task-id>

# Mark task as complete
task-master set-status --id=<task-id> --status=done

# Expand task into subtasks
task-master expand --id=<task-id> --research
```

## Project Architecture

### Core Structure
This is a **Next.js 15 application** with **Firebase authentication** designed as an AI image generator called "Nano Banana". The architecture follows modern React patterns with TypeScript.

### Key Components
- **Authentication System**: Complete Firebase Auth integration with email/password and Google OAuth
- **Context-based State Management**: React Context API for global auth state
- **Component-based UI**: Modular React components with TypeScript
- **Tailwind CSS**: Utility-first styling with dark mode support
- **Firebase Integration**: Auth, Firestore ready, and hosting configuration

### Directory Structure
```
src/
├── app/                    # Next.js 15 App Router
│   ├── layout.tsx         # Root layout with AuthProvider
│   ├── page.tsx           # Main application page
│   └── globals.css        # Global styles
├── components/            # Reusable React components
│   ├── LoginForm.tsx     # Auth form with email/password and Google login
│   ├── UserProfile.tsx   # User profile display component
│   └── FirestoreDemo.tsx # Database integration example
├── context/
│   └── AuthContext.tsx   # Firebase auth context provider
└── lib/
    └── firebase.ts       # Firebase configuration and initialization
```

### Authentication Flow
1. **Firebase Setup**: Configuration handled via environment variables
2. **Context Provider**: `AuthContext` manages authentication state globally
3. **Multiple Auth Methods**: Email/password and Google OAuth supported
4. **Protected Routes**: Authentication state determines UI rendering
5. **Error Handling**: Graceful degradation when Firebase not configured

### Firebase Integration Points
- **Authentication**: Email/password and Google OAuth via Firebase Auth
- **Firestore**: Ready for database integration (demo component included)
- **Hosting**: Configured for Firebase static hosting deployment
- **Security Rules**: Firestore rules configuration in place

## Development Workflow

### Environment Setup
1. Copy `.env.example` to `.env.local`
2. Configure Firebase credentials in environment file
3. Use `devbox shell` for consistent development environment
4. Install dependencies with `npm install`

### Firebase Configuration
- Project ID: `nano-banana-1758360022` (configured in `.firebaserc`)
- Authentication providers: Email/Password and Google
- Firestore database ready for integration
- Hosting configured for static deployment

### Testing Strategy
- **Playwright**: E2E testing configured for localhost:3002
- **Firebase Setup Tests**: Verification of Firebase integration
- **Screenshot Tests**: Visual regression testing capabilities
- **Network Investigation**: Debugging tools for connection issues

### TaskMaster Workflow Integration
This project includes comprehensive TaskMaster AI integration for structured development:

- **Project Initialization**: Use `task-master init` to set up task management
- **Requirements Parsing**: Convert PRD documents into structured tasks
- **Task Management**: Track progress through development lifecycle  
- **AI-Assisted Development**: Use research mode for complex task expansion
- **MCP Integration**: Claude Code integration via `.taskmaster/config.json`

### Key Development Notes
- **Port Configuration**: Dev server runs on port 3000, tests use port 3002
- **TypeScript**: Full type safety with strict mode enabled
- **Path Aliases**: `@/*` maps to `./src/*` for clean imports
- **Firebase Safety**: Graceful handling when Firebase not configured
- **Dark Mode**: Full dark mode support throughout the application
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### Security Considerations
- Environment variables for all Firebase credentials
- Client-side authentication state management only
- Firestore security rules configured but not detailed here
- Secret scanning available via detect-secrets
- No hardcoded API keys or sensitive data

### Deployment
- **Primary**: Firebase Hosting (configured in `firebase.json`)
- **Build Output**: Static export to `out/` directory  
- **Alternative Platforms**: Vercel, Netlify, Railway compatible
- **Environment Variables**: Configure in deployment platform dashboard

## TaskMaster Integration Details

This project uses TaskMaster AI for structured development workflows. Key files:
- `.taskmaster/CLAUDE.md`: Comprehensive TaskMaster integration guide
- `.taskmaster/config.json`: AI model configuration  
- `.taskmaster/tasks/`: Task management files (auto-generated)

### Essential TaskMaster Commands
- Daily workflow: `task-master next` → `task-master show <id>` → implement → `task-master set-status`
- Task expansion: `task-master expand --id=<id> --research` 
- Progress tracking: `task-master update-subtask --id=<id> --prompt="progress notes"`
- Dependencies: `task-master add-dependency --id=<id> --depends-on=<other-id>`

### MCP Integration
TaskMaster provides MCP server integration for Claude Code. Configuration in `.mcp.json` enables direct task management from Claude sessions.

## Development Tools

### Devbox Environment
- **Cloud Tools**: Azure CLI, Google Cloud SDK, AWS CLI
- **Kubernetes**: kubectl, kind, helm
- **Database**: PostgreSQL
- **Security**: Teller for secret management, detect-secrets for scanning
- **Version Control**: Git

### Security Tools
- **Secret Management**: Teller with Google Cloud integration
- **Secret Scanning**: detect-secrets with baseline configuration  
- **Environment Isolation**: Devbox for consistent development environments

### Code Quality
- **TypeScript**: Strict mode enabled for type safety
- **ESLint**: Next.js recommended configuration
- **Playwright**: Comprehensive E2E testing setup
- **Tailwind CSS**: Utility-first styling with consistent design system