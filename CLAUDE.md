# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Resume Generator Pro is a full-stack web application that uses AI to generate tailored resumes from a master resume. Users upload their master resume, and the app uses Claude AI to generate job-specific, ATS-optimized resumes.

## Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Authentication (Google Sign-in)
- **Database**: Cloud Firestore
- **Rich Text Editor**: TipTap
- **Document Generation**: docx library for DOCX export
- **Document Parsing**: pdfjs-dist (PDF), mammoth (DOCX)
- **Backend**: Vercel Serverless Functions in `/api`
- **AI**: Claude API (Anthropic)

## Development Commands

```bash
# Start development server (port 5173 by default)
npm run dev

# Build for production
npm run build

# Run ESLint
npm run lint

# Preview production build locally
npm run preview
```

## Architecture

### Data Flow

1. **Master Resume Upload** → User uploads PDF/DOCX → API parses it using Claude → Structured data stored in Firestore
2. **Resume Generation** → User provides job description → Claude tailors resume using master data → User edits in TipTap editor → Export to DOCX
3. **Authentication** → Firebase Auth with Google provider → Protected routes in React Router

### Key Directories

- `/src/components/` - React components organized by feature
  - `Auth/` - Login and protected route components
  - `Profile/` - Master resume upload and editing
  - `Generator/` - Resume generation and editing
  - `Dashboard.jsx` - Main dashboard with routing

- `/src/services/` - Service layer for external interactions
  - `firebase.js` - Firebase initialization and exports
  - `claudeService.js` - Claude API calls for generation and refinement
  - `docxService.js` - DOCX document generation with formatting
  - `masterResumeService.js` - Firestore operations for master resume
  - `resumeParserService.js` - Resume parsing via API
  - `usageService.js` - Token usage tracking

- `/src/utils/` - Utility functions and schemas
  - `profileSchema.js` - Data structure definitions for resume sections
  - `resumePageEstimator.js` - Page count estimation

- `/api/` - Vercel serverless functions
  - `generate-tailored-resume.js` - Main resume generation endpoint
  - `refine-resume.js` - Resume refinement endpoint
  - `parse-resume.js` - Resume parsing endpoint

### Firebase Structure

Firestore collections:
- `masterResumes/{userId}` - Stores parsed master resume data with `parsedData` field containing structured resume information
- `usageHistory/{userId}/history/{entryId}` - Token usage tracking per user

### Key Data Structures

**parsedData structure** (stored in Firestore):
```javascript
{
  personalInfo: { name, email, phone, location, linkedin, github, website },
  professionalSummary: string,
  skills: { category: [skills] },
  workExperience: [{ company, position, location, period, achievements: [] }],
  projects: [{ name, date, technologies: [], bullets: [] }],
  education: [{ school, degree, field, year, gpa, relevantCoursework }],
  certifications: [{ name, date }]
}
```

### Routing Structure

- `/` → Redirects to `/login` or `/dashboard`
- `/login` → Login page (public)
- `/dashboard` → Home dashboard (protected)
- `/dashboard/upload-resume` → Upload new master resume
- `/dashboard/update-resume` → Update existing master resume
- `/dashboard/generate` → Generate tailored resume

## Important Patterns

### Resume Generation Flow

1. Master resume data is loaded from Firestore
2. User optionally provides job description
3. Frontend sends `parsedData` + `jobDescription` to `/api/generate-tailored-resume`
4. API uses Claude to intelligently select and tailor content
5. Response includes structured resume data with formatting markers (e.g., `**bold**`)
6. User edits in TipTap editor
7. Export to DOCX using `docxService.js`

### DOCX Formatting

The `docxService.js` implements specific formatting rules:
- Name: 26pt, bold, centered
- Section headers: 24pt, bold, with subtle underline
- Body text: 22pt (11pt), Times New Roman
- Clickable hyperlinks for email and social links
- Bold text markers: `**text**` parsed into actual bold formatting
- Tight bullet spacing with proper indentation
- Right-aligned dates using tab stops
- 0.5" margins on all sides

### Bold Text Markers

Throughout the codebase, `**text**` is used to mark text that should be bold. The `parseFormattedText()` function in `docxService.js` converts these markers to actual bold formatting in the generated DOCX.

### API Endpoints

All API functions are Vercel serverless functions with:
- CORS headers enabled
- 80-second timeout (configured in vercel.json)
- 1024MB memory allocation
- POST method for all operations

## Environment Variables

The application requires:
- Firebase configuration (in `src/services/firebase.js`)
- Claude API key (used in `/api` functions, typically via Vercel environment variables)

## Deployment

Configured for Vercel deployment:
- Frontend builds to `/dist`
- API routes at `/api/*` are serverless functions
- Automatic routing via `vercel.json` rewrites
- SPA fallback to `/index.html` for client-side routing

## Key Implementation Notes

### Location Handling

The `extractLocation()` function in the API is critical and should be bulletproof. It extracts location from experience/education entries by checking multiple field names (`location`, `city`, `state`, etc.).

### Date Formatting

Dates in format `YYYY-MM` are automatically converted to `Month YYYY` in the DOCX output. The `formatDate()` function handles this conversion.

### Experience Titles

In the generated DOCX, the company name is used as the main title for each experience entry, with location appended if available. Dates are right-aligned using tab stops.

### Projects Formatting

Projects are formatted as bullets with:
- Project name (bold) as header
- Description bullets or single description bullet
- Technologies list at the end (bold label)

### Page Estimation

The `resumePageEstimator.js` estimates page count based on character counts and formatting rules to help users stay within target page limits (typically 1-2 pages).
