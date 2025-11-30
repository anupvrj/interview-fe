# Hello Interview - Frontend

Modern, responsive Next.js frontend for the Hello Interview AI mock interview platform.

## 🎨 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: Clerk
- **HTTP Client**: Axios
- **Forms**: React Hook Form + Zod
- **File Upload**: React Dropzone
- **Charts**: Recharts

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (sign-in, sign-up)
│   ├── dashboard/         # Dashboard and interviews
│   ├── interview/         # Live interview canvas
│   ├── layout.tsx         # Root layout with Clerk provider
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles
│
├── components/
│   └── ui/                # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── ...
│
└── lib/
    ├── api.ts             # Axios API client
    └── utils.ts           # Utility functions
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
```

### Environment Variables

Create `.env.local` in the frontend root:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5004/api

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### Get Clerk Keys

1. Go to [clerk.com](https://clerk.com) and create account
2. Create new application
3. Copy **Publishable Key** and **Secret Key**
4. Paste into `.env.local`

### Development

```bash
# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

### Build

```bash
# Production build
npm run build

# Start production server
npm start
```

## 🎨 Design System

### Color Palette

```css
/* Primary Colors */
--primary: #8b5cf6 (Purple)
--secondary: #06b6d4 (Cyan)
--accent: #ec4899 (Pink)

/* Semantic Colors */
--success: #10b981 (Green)
--warning: #f59e0b (Orange)
--error: #ef4444 (Red)

/* Neutrals */
--background: #f9fafb (Light gray)
--foreground: #1f2937 (Dark gray)
```

### Typography

- **Font**: Inter (Google Fonts)
- **Headings**: 700 weight
- **Body**: 400 weight
- **Scale**: Base 16px

### Components

All UI components are built with **shadcn/ui**:

- Pre-styled with Tailwind
- Fully accessible (ARIA)
- Customizable variants
- TypeScript support

## 🔑 Key Features

### Authentication

- Sign up with email or Google
- Protected routes with middleware
- Auto-redirect to dashboard after login

### Dashboard

- Overview stats (total interviews, avg score, improvement)
- Recent interviews list
- Quick action buttons

### Interview Creation

- Multi-step form
- Resume upload (drag & drop)
- File validation (PDF, max 5MB)
- Real-time error handling

### Live Interview

- WebRTC video recording
- Real-time question display
- Camera/mic controls
- Progress tracking

## 📡 API Integration

### API Client Setup

```typescript
// lib/api.ts
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});
```

### Example Usage

```typescript
// Create interview
const response = await interviewApi.create(userId, {
  role: "Software Developer",
  experience: 0,
  language: "en",
  resume: file,
});

// List interviews
const interviews = await interviewApi.list(userId);

// Get interview
const interview = await interviewApi.get(interviewId);
```

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Fix linting issues
npm run lint -- --fix
```

## 📦 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables on Vercel

Add these in Vercel dashboard:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_API_URL`

### Other Platforms

Build static export:

```bash
npm run build
# Deploy 'out' directory
```

## 🎯 Performance

- **Lighthouse Score**: 95+ (Performance)
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Bundle Size**: < 200KB (gzipped)

### Optimization Techniques

- Image optimization with Next.js Image
- Code splitting (automatic with App Router)
- Font optimization (next/font)
- CSS purging (Tailwind)

## 🐛 Troubleshooting

### "Clerk keys not found"

- Ensure `.env.local` exists
- Check key format (pk*test*... / sk*test*...)
- Restart dev server after changes

### "API connection failed"

- Ensure backend is running on port 5004
- Check `NEXT_PUBLIC_API_URL` in .env.local
- Verify CORS settings in backend

### "Resume upload fails"

- Check file size (< 5MB)
- Verify file type (PDF only)
- Ensure S3 credentials in backend

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Clerk Docs](https://clerk.com/docs)

## 🤝 Contributing

See main [README](../README.md) for contribution guidelines.

---

Made with 💜 by Hello Interview Team
