# 🍌 Nano Banana Blueprint

Nano Banana is our reusable reference implementation for AI-assisted creative tools. It pairs a modern Next.js 15 front end with Firebase services, Google Gemini image generation, and an embedded AI assistant so we can clone the same foundations for future products without re-solving infrastructure or UX. This README documents the architectural decisions, tooling, and operational playbooks you can hand to the next product requirements document (PRD).

---

## 1. Design Principles

| Principle | Why it matters | Where it shows up |
| --- | --- | --- |
| **Secure-by-default access** | Every privileged workflow is guarded by identity and approvals so prototype assets stay private. | Firebase Auth gate with admin approvals in `AuthContext`. 【F:src/context/AuthContext.tsx†L1-L138】|
| **Composable building blocks** | Features are encapsulated so we can lift authentication, data, and AI modules into the next project. | Context providers in `src/context`, hooks in `src/hooks`, and UI modules in `src/components`. |
| **Operational clarity** | Documented flows and tooling lower onboarding friction for new engineers and stakeholders. | This README, `docs/` deployment guides, and Playwright scenario coverage. |
| **Progressive enhancement** | We start with mocked APIs and fall back gracefully when credentials are missing, so demos still work. | Mock/real Nano Banana API toggle in `src/lib/nanoBananaAPI.ts`. 【F:src/lib/nanoBananaAPI.ts†L1-L204】|

---

## 2. Core Stack & Tooling

| Layer | Technology | Reasoning |
| --- | --- | --- |
| UI framework | **Next.js 15 App Router** | File-based routing, React Server Components, and serverless API routes in one platform. |
| Language & DX | **TypeScript** with strict types | Shared types across client, hooks, and API routes (see `src/types`). |
| Styling | **Tailwind CSS** | Rapid iteration on the glassmorphism aesthetic with responsive primitives (`tailwind.config.js`). 【F:tailwind.config.js†L1-L17】|
| Auth & data | **Firebase Authentication, Firestore, Storage** | Managed identity, approval workflow, real-time data, and bucket storage from one console (`src/lib/firebase.ts`). 【F:src/lib/firebase.ts†L1-L43】|
| AI services | **Google Gemini image APIs**, optional Nano Banana mock | Gemini provides real image generation; mock mode keeps local dev unblocked (`src/app/api/generate-image/route.ts`). 【F:src/app/api/generate-image/route.ts†L1-L72】|
| Assistant | **OpenAI / Anthropic chat providers + repo context search** | Multi-provider fallback with code-aware grounding (`src/app/api/chat/route.ts`). 【F:src/app/api/chat/route.ts†L1-L73】|
| Testing | **Playwright** E2E suites | Scenario-based coverage for authentication, storage, AI workflows (`tests/`). |

---

## 3. Application Architecture

### 3.1 Client Composition

* `src/app/layout.tsx` wraps the entire app with `AuthProvider` and `CanvasImageProvider`, enforcing authenticated state management and shared canvas utilities. 【F:src/app/layout.tsx†L1-L25】
* `src/app/page.tsx` orchestrates the public marketing shell, authentication gates, and feature highlights while conditionally rendering the secure canvas once a user is approved. 【F:src/app/page.tsx†L1-L88】
* Contexts in `src/context/` centralize authentication (Google sign-in, approval state, admin detection) and canvas state (generated/uploaded image lifecycle, filter pipeline). 【F:src/context/CanvasImageContext.tsx†L1-L132】

### 3.2 Feature Modules

* **Authentication & Approvals** – `AuthContext` tracks Firebase login, lazily creates `userApprovals` documents, and enforces admin allow-lists pulled from `NEXT_PUBLIC_FIREBASE_ADMIN_EMAILS`. 【F:src/context/AuthContext.tsx†L33-L137】【F:src/lib/admin.ts†L1-L24】
* **Admin Dashboard** – `AdminApprovals` reads and updates Firestore approval documents with optimistic UI states for pending users. 【F:src/components/AdminApprovals.tsx†L1-L126】
* **AI Canvas** – `ImageGenerator` coordinates prompt entry, suggestion chips, result display, and Canvas filter controls while delegating heavy logic to hooks. 【F:src/components/ImageGenerator.tsx†L1-L137】
* **Remix & Transfusion** – `useImageRemix` and `useImageTransfusion` (paired with `ImageTransfusionPanel`) send generated or uploaded images through edit/transfusion API routes, then stream the result back to the canvas. 【F:src/hooks/useImageRemix.ts†L1-L77】【F:src/components/ImageTransfusionPanel.tsx†L1-L120】
* **Firestore Demo** – `FirestoreDemo` provides a persisted messaging sandbox gated behind approval, showcasing list/create/delete flows with optimistic states. 【F:src/components/FirestoreDemo.tsx†L1-L120】
* **Issue Reporting & Assistant** – `ChatBotWidget` exposes chat, repository/web search modes, and GitHub issue filing; the `/api/chat` route adds repo context snippets and cycles through providers for resilience. 【F:src/components/ChatBotWidget.tsx†L1-L120】【F:src/app/api/chat/route.ts†L30-L99】

### 3.3 Server & Integration Layer

* **API Routes** – Located under `src/app/api/*`. `generate-image`, `edit-image`, and `transfuse-image` wrap Gemini (or the mock) while normalizing error responses. 【F:src/app/api/generate-image/route.ts†L10-L71】【F:src/lib/nanoBananaAPI.ts†L117-L203】
* **Image Persistence** – `useImageGeneration` auto-saves outputs to Firebase Storage with structured paths (`nano-banana/{uid}/{date}-{slug}-{timestamp}`) when a user is logged in. 【F:src/hooks/useImageGeneration.ts†L1-L110】
* **Repository-aware Assistant** – `src/lib/chat/repository.ts` walks project files (ignoring `node_modules`, `tests`, etc.) to extract relevant snippets for grounding assistant responses. 【F:src/lib/chat/repository.ts†L1-L95】

### 3.4 Data & Security Rules

* **Firestore Rules** limit `userApprovals` creation to the requesting user, allow admin-only approval updates, and gate `messages` behind approved accounts. 【F:firestore.rules†L1-L64】
* **Storage Rules** currently expose permissive buckets for testing (`test-uploads/**`, `nano-banana/**`, `user-uploads/**`). Tighten them before production. 【F:storage.rules†L1-L22】

---

## 4. Environment & Configuration

Create `.env.local` from `.env.example` and provide the following:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase client SDK configuration. |
| `NEXT_PUBLIC_FIREBASE_ADMIN_EMAILS` | Comma-separated list of lowercase emails that auto-approve (`lib/admin.ts`). 【F:src/lib/admin.ts†L1-L24】|
| `GEMINI_API_KEY` | Required for Google Generative AI image routes. |
| `NEXT_PUBLIC_USE_REAL_API` | Toggle between live Gemini-backed generation and the mock client. 【F:src/lib/nanoBananaAPI.ts†L205-L214】|
| `OPENAI_API_KEY` / `OPENAI_MODEL` | Optional assistant provider. 【F:src/lib/chat/providers.ts†L19-L70】|
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | Alternative assistant provider. 【F:src/lib/chat/providers.ts†L72-L130】|
| `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO` | Enable GitHub issue creation from the assistant. |
| `NEXT_PUBLIC_APP_URL` | Public URL for OAuth redirects and assistant references. |

> Tip: Add staging vs. production admin emails in both environment variables and Firestore rules to keep approvals consistent.

---

## 5. Local Development Workflow

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Run the dev server**
   ```bash
   npm run dev
   ```
3. **Log in** with Google; the first non-admin account lands in the approval queue. Approve via the Firebase console or the in-app Admin dashboard.
4. **Experiment** with the canvas: generate prompts, upload images, try remix/transfusion panels, and post notes in the Firestore demo.

Optional tooling:

* `devbox shell` for a reproducible environment (see `devbox.json`).
* `task-master` CLI for structured tasks if you integrate with TaskMaster AI (scripts are included in the repository).

---

## 6. Testing & Quality Gates

* **Linting** – `npm run lint`
* **End-to-end** – `npx playwright test` targets login, approvals, AI flows, storage, and regression investigations (see `tests/`).
* **Manual guides** – Screenshot workflows live alongside Playwright coverage for fast visual QA (`tests/screenshots`, `*.png`).

Adopt the rule of thumb: run lint + targeted Playwright suites before shipping UI or auth changes, and refresh Firestore/Storage rules during security reviews.

---

## 7. Deployment Playbook

### Firebase + Vercel Hybrid

1. Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```
2. Push the Next.js app to Vercel using the included [`vercel.json`](vercel.json) and follow `docs/deployment/vercel.md` for environment setup.
3. Mirror environment variables (`.env.local`) into your hosting provider. Enable `NEXT_PUBLIC_USE_REAL_API=true` only after validating the Gemini quota.

### Alternatives

* **Firebase Hosting** – `npm run build && firebase deploy` for single-provider hosting.
* **Netlify / Railway / AWS Amplify** – Provided configuration files (`netlify.toml`, `firebase.json`) and serverless API compatibility make porting straightforward.

Remember to revisit Storage rules for production hardening and to configure custom domains (`NEXT_PUBLIC_APP_URL`) for OAuth callbacks.

---

## 8. Reusing the Blueprint for the Next PRD

Use this checklist when bootstrapping a new product on top of Nano Banana:

1. **Name the experience** – Update branding copy, hero stats, and metadata in `src/app/page.tsx` & `layout.tsx`.
2. **Define access policy** – Set admin emails, update Firestore/Storage rules, and review approval workflows for your audience.
3. **Choose AI capabilities** – Decide between mock mode or live Gemini (and configure alternative providers if needed).
4. **Shape the data model** – Adapt Firestore collections (start with the `messages` example) and extend security rules accordingly.
5. **Customize the canvas** – Reuse `ImageGenerator`, `ImageDisplay`, and contexts, or swap in domain-specific components using the same hooks.
6. **Integrate tooling** – Enable the assistant, GitHub issue routing, and adjust tests to match your critical journeys.
7. **Document deliverables** – Capture screenshots, Playwright fixtures, and an updated README section for stakeholders.

> Copy this section into future PRDs to communicate which modules you will keep, extend, or replace.

---

## 9. Reference Assets & Further Reading

* **Screenshots** – `main-page-screenshot.png`, `login-page-screenshot.png`, and additional flows under `/`. These illustrate expected states for QA and design discussions.
* **Docs** – Deployment (`docs/deployment/vercel.md`) and the chat assistant prototype (`docs/chat-bot/`).
* **Testing Report** – `TESTING_REPORT.md` captures historical validation steps and can seed future checklists.

---

## 10. Support & Troubleshooting

* Missing Firebase credentials → Auth falls back gracefully, but approvals will never resolve; update `.env.local` and redeploy.
* Gemini quota errors → The API route returns descriptive status codes; monitor logs and rotate keys as needed. 【F:src/app/api/generate-image/route.ts†L47-L71】
* Assistant misconfiguration → `/api/chat` checks for providers and returns actionable errors when neither OpenAI nor Anthropic keys exist. 【F:src/lib/chat/providers.ts†L132-L168】

By grounding the blueprint in these modules and guardrails, we can replicate the same secure, AI-ready foundation whenever a new product brief arrives.
