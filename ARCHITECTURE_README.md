# Nano Banana - Architecture & Design Documentation

## 🏗️ Project Overview

Nano Banana is a **production-ready AI image generation platform** built with modern web technologies. It serves as a comprehensive template for building secure, scalable web applications with authentication, database integration, file storage, and AI-powered features.

### Key Features
- **🔐 Admin-Gated Authentication**: Google OAuth with Firebase Auth + admin approval system
- **🎨 AI Image Generation**: Multiple AI providers (OpenAI DALL-E, Google Gemini) with real-time generation
- **🗄️ Real-time Database**: Firestore integration with optimistic UI patterns
- **📁 File Storage**: Firebase Storage for image uploads and management
- **🧪 Comprehensive Testing**: Playwright E2E tests covering all user flows
- **🚀 Production Deployment**: Vercel deployment with environment management

---

## 🛠️ Technology Stack

### Frontend Framework
- **Next.js 15.1.0** - App Router architecture for modern React development
- **React 18** - Client-side rendering with hooks and context
- **TypeScript** - Type safety across the entire codebase
- **Tailwind CSS** - Utility-first styling with glassmorphism design system

### Backend & APIs
- **Next.js API Routes** - Serverless API endpoints
- **Firebase Admin SDK** - Server-side Firebase operations
- **OpenAI API** - DALL-E image generation
- **Google Gemini API** - Alternative AI image generation

### Database & Storage
- **Firebase Firestore** - NoSQL document database with real-time subscriptions
- **Firebase Storage** - Cloud storage for images and files
- **Firebase Auth** - Authentication with Google OAuth provider

### Development & Testing
- **Playwright** - End-to-end testing framework
- **ESLint** - Code quality and consistency
- **TypeScript** - Type checking and IDE support

### Deployment & DevOps
- **Vercel** - Production hosting with automatic deployments
- **GitHub Actions** - CI/CD pipeline integration
- **Environment Variables** - Secure configuration management

---

## 📁 Project Structure

```
nano-banana/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API endpoints
│   │   │   ├── generate-image/ # Image generation endpoint
│   │   │   ├── chat/          # Chat API endpoint
│   │   │   └── ...
│   │   ├── admin/             # Admin dashboard
│   │   ├── layout.tsx         # Root layout with providers
│   │   └── page.tsx           # Home page
│   ├── components/            # Reusable React components
│   │   ├── ImageGenerator.tsx # Main image generation UI
│   │   ├── LoginForm.tsx      # Authentication UI
│   │   ├── UserProfile.tsx    # User management
│   │   └── ...
│   ├── context/               # React context providers
│   │   ├── AuthContext.tsx    # Authentication state
│   │   └── CanvasImageContext.tsx # Image state management
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities and configurations
│   │   ├── firebase.ts        # Firebase initialization
│   │   └── ...
│   └── types/                 # TypeScript type definitions
├── tests/                     # Playwright E2E tests
├── docs/                      # Documentation and guides
├── firebase.json              # Firebase configuration
├── vercel.json                # Vercel deployment config
└── package.json               # Dependencies and scripts
```

---

## 🔒 Authentication Architecture

### Design Decision: Admin-Gated System
Instead of traditional user registration, we implemented an **admin approval system** that provides:
- **Security**: Only approved users can access the platform
- **Quality Control**: Prevents spam and ensures legitimate usage
- **Scalability**: Easy to manage user base growth

### Implementation Flow
1. **Google OAuth**: Users sign in with Google accounts
2. **Firestore Check**: System checks user approval status in `users` collection
3. **Admin Approval**: Admins can approve/deny users via admin dashboard
4. **Session Management**: Firebase Auth handles session persistence

```typescript
// src/context/AuthContext.tsx
const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isApproved, setIsApproved] = useState(false)

  // Real-time user approval status monitoring
  useEffect(() => {
    if (user) {
      const unsubscribe = onSnapshot(
        doc(db, 'users', user.uid),
        (doc) => setIsApproved(doc.data()?.approved || false)
      )
      return unsubscribe
    }
  }, [user])
}
```

---

## 🗄️ Database Design

### Firestore Collections

#### `users` Collection
```json
{
  "uid": "google_user_id",
  "email": "user@example.com",
  "displayName": "User Name",
  "photoURL": "https://...",
  "approved": true,
  "createdAt": "timestamp",
  "lastLogin": "timestamp"
}
```

#### `images` Collection
```json
{
  "id": "auto_generated_id",
  "userId": "user_uid",
  "prompt": "A beautiful sunset...",
  "imageUrl": "https://storage.googleapis.com/...",
  "provider": "openai|gemini",
  "createdAt": "timestamp",
  "metadata": {
    "size": "1024x1024",
    "style": "vivid"
  }
}
```

### Security Rules
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Images are user-scoped
    match /images/{imageId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## 🎨 AI Integration Architecture

### Multi-Provider Strategy
We support multiple AI providers for redundancy and feature diversity:

- **OpenAI DALL-E 3**: High-quality, detailed images
- **Google Gemini**: Alternative provider with different strengths

### API Endpoint Design
```typescript
// src/app/api/generate-image/route.ts
export async function POST(request: Request) {
  try {
    // 1. Validate authentication
    const token = await verifyIdToken(authHeader)

    // 2. Check user approval status
    const userDoc = await admin.firestore().doc(`users/${token.uid}`).get()
    if (!userDoc.data()?.approved) {
      return NextResponse.json({ error: 'User not approved' }, { status: 403 })
    }

    // 3. Generate image with selected provider
    const imageUrl = await generateWithProvider(prompt, provider)

    // 4. Save to Firestore
    await admin.firestore().collection('images').add({
      userId: token.uid,
      prompt,
      imageUrl,
      provider,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })

    return NextResponse.json({ imageUrl })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

---

## 🎯 UI/UX Design Principles

### Glassmorphism Design System
- **Visual Hierarchy**: Semi-transparent cards with backdrop blur
- **Color Palette**: Dark theme with slate grays and accent colors
- **Typography**: Inter font for readability
- **Responsive**: Mobile-first design with Tailwind breakpoints

### State Management Patterns
- **React Context**: Global authentication and image state
- **Optimistic UI**: Immediate feedback before server confirmation
- **Loading States**: Skeleton screens and progress indicators
- **Error Handling**: User-friendly error messages with retry options

```typescript
// src/context/CanvasImageContext.tsx
export function CanvasImageProvider({ children }: { children: React.ReactNode }) {
  const [canvasImage, setCanvasImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const generateImage = async (prompt: string) => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      const data = await response.json()
      setCanvasImage(data.imageUrl)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <CanvasImageContext.Provider value={{ canvasImage, generateImage, isGenerating }}>
      {children}
    </CanvasImageContext.Provider>
  )
}
```

---

## 🧪 Testing Strategy

### End-to-End Testing with Playwright
We maintain comprehensive E2E tests covering all critical user journeys:

```typescript
// tests/basic-functionality.spec.ts
test('complete user journey', async ({ page }) => {
  // 1. Authentication flow
  await page.goto('/')
  await page.click('[data-testid="google-signin"]')

  // 2. Image generation
  await page.fill('[data-testid="prompt-input"]', 'A beautiful sunset')
  await page.click('[data-testid="generate-button"]')

  // 3. Verify image appears
  await expect(page.locator('[data-testid="generated-image"]')).toBeVisible()
})
```

### Test Categories
- **Authentication Tests**: Login, logout, approval flows
- **Image Generation Tests**: API integration, error handling
- **Database Tests**: Firestore operations, real-time updates
- **UI Tests**: Component interactions, responsive design

---

## 🚀 Deployment Architecture

### Vercel Configuration
```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "git": {
    "deploymentEnabled": {
      "main-clean": true,
      "main": true
    }
  }
}
```

### Environment Management
- **Development**: Local `.env.local` for development
- **Production**: Vercel environment variables
- **Firebase**: Separate projects for dev/staging/prod

### CI/CD Pipeline
1. **Code Push**: Developer pushes to repository
2. **Automated Tests**: Playwright tests run on every PR
3. **Build Process**: Vercel builds and deploys automatically
4. **Rollback**: Easy rollback via Vercel dashboard

---

## 🔧 Key Design Decisions & Rationale

### 1. Next.js App Router vs Pages Router
**Decision**: App Router
**Rationale**: Modern React patterns, better TypeScript support, improved performance

### 2. Firebase vs Traditional Database
**Decision**: Firebase
**Rationale**: Real-time capabilities, automatic scaling, integrated auth/storage

### 3. Admin Approval vs Open Registration
**Decision**: Admin Approval
**Rationale**: Quality control, security, prevents abuse

### 4. Multi-Provider AI Strategy
**Decision**: Support multiple AI providers
**Rationale**: Redundancy, feature diversity, cost optimization

### 5. TypeScript Throughout
**Decision**: Full TypeScript adoption
**Rationale**: Type safety, better DX, fewer runtime errors

---

## 📋 PRD Template for Future Projects

When building your next application using this architecture, consider these sections for your Product Requirements Document:

### 1. Authentication Requirements
- [ ] User registration method (OAuth providers, email/password, magic links)
- [ ] Approval workflow (automatic, manual, hybrid)
- [ ] User roles and permissions
- [ ] Session management requirements

### 2. Database & Storage Requirements
- [ ] Data models and relationships
- [ ] Real-time vs batch processing needs
- [ ] File storage requirements (images, documents, videos)
- [ ] Backup and disaster recovery needs

### 3. AI/ML Integration Requirements
- [ ] AI provider selection (OpenAI, Google, Anthropic, etc.)
- [ ] Rate limiting and cost management
- [ ] Content moderation needs
- [ ] Model fallback strategies

### 4. UI/UX Requirements
- [ ] Design system and branding
- [ ] Responsive design requirements
- [ ] Accessibility standards (WCAG compliance)
- [ ] Performance metrics (Core Web Vitals)

### 5. Testing & Quality Requirements
- [ ] Test coverage targets
- [ ] Performance benchmarks
- [ ] Security testing requirements
- [ ] Browser/device compatibility

### 6. Deployment & Operations Requirements
- [ ] Hosting platform selection
- [ ] CI/CD pipeline requirements
- [ ] Monitoring and alerting
- [ ] Scaling expectations

### 7. Security & Compliance Requirements
- [ ] Data privacy regulations (GDPR, CCPA)
- [ ] Security certifications needed
- [ ] Audit trail requirements
- [ ] Content moderation policies

---

## 🔗 Reusable Building Blocks

This project provides these reusable patterns for future applications:

### 🔐 Authentication Patterns
- Google OAuth with Firebase Auth
- Admin approval workflow
- Role-based access control
- Session management with React Context

### 🗄️ Database Patterns
- Firestore security rules
- Real-time subscriptions
- Optimistic UI updates
- Data validation and sanitization

### 🎨 UI Patterns
- Glassmorphism design system
- Loading states and error handling
- Responsive component library
- Form validation and submission

### 🧪 Testing Patterns
- Playwright E2E test setup
- Authentication testing utilities
- API integration tests
- UI component testing

### 🚀 Deployment Patterns
- Vercel deployment configuration
- Environment variable management
- CI/CD pipeline setup
- Performance monitoring

---

## 🚀 Getting Started with This Template

1. **Clone and Setup**
   ```bash
   git clone <repository>
   cd nano-banana
   npm install
   ```

2. **Configure Firebase**
   - Create Firebase project
   - Enable Auth, Firestore, Storage
   - Download service account key
   - Set environment variables

3. **Configure AI Providers**
   - Get OpenAI API key
   - Get Google Gemini API key
   - Add to environment variables

4. **Deploy to Vercel**
   ```bash
   npx vercel
   ```

5. **Run Tests**
   ```bash
   npm run test
   ```

---

## 📞 Support & Contributing

This architecture has been battle-tested in production and provides a solid foundation for building modern web applications. The patterns and practices documented here can be adapted for various use cases while maintaining security, performance, and maintainability.

For questions or contributions, please refer to the project repository and documentation.

---

*Built with ❤️ using Next.js, Firebase, and modern web technologies*