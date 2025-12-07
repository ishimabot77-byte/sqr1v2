# SQR1 - Note-Taking App

A minimal note-taking app with browser-style tabs, built with Next.js and TypeScript.

## Features

- **Projects**: Create up to 3 projects (free version limit)
- **Tabs**: Each project supports up to 7 browser-style tabs
- **Editor**: Clean text editor with 1000 character limit per tab
- **Auto-save**: All changes are automatically saved to localStorage
- **Minimal UI**: Black background with white text theme

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page (project list)
│   ├── globals.css         # Global styles
│   └── project/
│       └── [id]/
│           └── page.tsx    # Project workspace page
├── components/
│   ├── Tab.tsx             # Individual tab component
│   ├── TabBar.tsx          # Tab bar container
│   └── Editor.tsx          # Text editor component
├── lib/
│   ├── types.ts            # TypeScript types & constants
│   └── localStorage.ts     # localStorage utilities
```

## Data Structure

```typescript
interface Project {
  id: string;
  title: string;
  tabs: Tab[];
}

interface Tab {
  id: string;
  title: string;
  content: string;
}
```

Data is persisted in localStorage under the key `sqr1-projects`.

## Limits (Free Version)

- Maximum 3 projects
- Maximum 7 tabs per project
- Maximum 1000 characters per tab

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- localStorage for persistence






