# Frontend Style Guide

## Naming Conventions
- Components: PascalCase (e.g., `DocumentCard`, `SearchBar`)
- Hooks: camelCase with `use` prefix (e.g., `useDocuments`, `useSearch`)
- Files: PascalCase for components, camelCase for utilities
- Props: camelCase with descriptive names
- Event handlers: `handle` prefix (e.g., `handleClick`, `handleSubmit`)

## State Location Rules
- Keep state as local as possible
- Use Context only for truly global state (auth, theme)
- Prefer custom hooks for state logic
- Business logic in separate service layers

## Component Structure
```tsx
// 1. Imports (React first, then libraries, then local)
import React from 'react';
import { Button } from '@/components/ui/button';
import { useCustomHook } from '@/hooks/useCustomHook';

// 2. Types/Interfaces
interface ComponentProps {
  title: string;
  onAction: () => void;
}

// 3. Component with business logic extracted to hooks
export function Component({ title, onAction }: ComponentProps) {
  const { data, loading, error } = useCustomHook();
  
  return (
    // JSX here
  );
}
```

## File Organization
```
src/
├── components/
│   ├── ui/           # Base UI components
│   ├── features/     # Feature-specific components
│   └── layout/       # Layout components
├── hooks/            # Custom hooks
├── services/         # Business logic & API calls
├── types/            # TypeScript definitions
├── utils/            # Pure utility functions
└── pages/            # Page components (thin, mostly composition)
```

## CSS Rules
- Use Tailwind semantic tokens from design system
- No direct colors (use CSS variables from index.css)
- Prefer utility classes over custom CSS
- Use HSL color format only