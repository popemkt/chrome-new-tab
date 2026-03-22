# Chrome Extension TypeScript Project Structure

## Overview

This project is a Chrome extension built with TypeScript using a monorepo structure powered by Turborepo. Understanding how the different parts connect is essential for effective development.

## Project Organization

### Monorepo Structure

The project uses a monorepo approach with [Turborepo](https://turbo.build/repo), which allows:
- Sharing code between packages
- Optimizing builds with caching
- Managing dependencies efficiently

```
chrome-extension-ts/
├── chrome-extension/   # Core extension configuration
├── packages/           # Shared utilities and components
├── pages/              # Extension pages (popup, options, etc.)
├── dist/               # Built extension output
├── turbo.json          # Turborepo configuration
└── package.json        # Root package configuration
```

## Build System

### Key Technologies

1. **Turborepo** - Orchestrates the entire build pipeline
2. **Vite** - Handles bundling and development for individual pages
3. **TypeScript** - Provides static typing and modern JS features
4. **pnpm** - Package manager with better performance and disk space usage

### How Builds Work

1. The build process starts with the `pnpm build` command
2. Turborepo reads the `turbo.json` file to determine build order and dependencies
3. Individual packages are built based on their dependencies
4. Page components are built with Vite (configured in each page's `vite.config.mts`)
5. The Chrome extension manifest is generated from `chrome-extension/manifest.ts`
6. All output is placed in the `dist/` directory

## Entry Points

### Extension Entry Points

1. **Manifest** - `chrome-extension/manifest.ts` defines the extension structure
   - Specifies which HTML files load for different extension parts
   - Defines permissions, background scripts, etc.

2. **Background Service** - `chrome-extension/src/background/index.ts`
   - Runs in the extension's background context
   - Handles initialization and global state

3. **HTML Pages**
   - Each HTML file in the `dist/` directory is an entry point for a specific extension component
   - For example, `dist/new-tab/index.html` is the entry point for the new tab page

### Page Entry Points

Each page has its own entry points:

1. **HTML** - `pages/[page-name]/index.html`
   - The HTML template for each extension component

2. **TypeScript Entry** - `pages/[page-name]/src/index.tsx`
   - The main JS entry point referenced by the HTML

3. **Component** - `pages/[page-name]/src/[ComponentName].tsx`
   - The main React component for the page

## Package System

1. **Local Packages**
   - Located in `packages/` directory
   - Imported with `@extension/[package-name]` syntax
   - Examples: `storage`, `shared`, `i18n`

2. **Pages as Packages**
   - Each page is also a package with its own `package.json`
   - Can depend on local packages and external dependencies

## TypeScript Configuration

1. **Base Configuration** - `packages/tsconfig/`
   - Contains shared TypeScript configuration
   - Extended by individual packages and pages

2. **Path Aliases**
   - Configure imports with aliases like `@src/`, `@extension/`
   - Makes imports cleaner and more maintainable

## Development Workflow

1. **Development Mode** - `pnpm dev`
   - Starts the development server
   - Uses HMR (Hot Module Replacement) for faster iteration
   - Updates the extension as you save changes

2. **Building for Production** - `pnpm build`
   - Creates optimized production build
   - Outputs to `dist/` directory

## Key Files for Customization

1. **Manifest** - `chrome-extension/manifest.ts`
   - Customize extension metadata, permissions, and features

2. **Pages** - Various files in `pages/[page-name]/src/`
   - Modify UI and functionality of each extension component

3. **Storage** - `packages/storage/lib/impl/`
   - Add or modify storage implementations for extension data

4. **Shared Components** - `packages/shared/lib/`
   - Common utilities and components used across pages

## Connection Between Files

Understanding how files connect requires tracing the entry points:

1. The manifest sp ecifies HTML files for different extension components
2. Each HTML file loads a JavaScript entry point
3. These entry points import components and utilities from other files
4. Components use shared packages for common functionality

This creates a tree-like structure where everything eventually connects back to the manifest and extension entry points.
