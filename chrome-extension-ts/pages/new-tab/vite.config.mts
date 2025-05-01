// [GUIDE] VITE BUILD CONFIGURATION FILE
// [GUIDE] This is the build configuration for the new-tab page component
// [GUIDE] It extends the shared configuration with page-specific settings

// [GUIDE] Node.js path utilities for resolving file paths
import { resolve } from 'node:path';

// [GUIDE] IMPORTANT: Import the shared configuration wrapper
// [GUIDE] This is a key part of the monorepo architecture that provides consistent settings
// [GUIDE] and reduces duplication across all pages
import { withPageConfig } from '@extension/vite-config';

// [GUIDE] Define important directories for this component
const rootDir = resolve(import.meta.dirname);  // Root of this page package
const srcDir = resolve(rootDir, 'src');       // Source code directory

// [GUIDE] ENTRY POINT FOR VITE BUILD SYSTEM
// [GUIDE] Vite uses this configuration to:
// [GUIDE] 1. Locate source files
// [GUIDE] 2. Process and bundle them, including TypeScript transpilation
// [GUIDE] 3. Output the results to the specified location

// [GUIDE] TYPESCRIPT COMPILATION PROCESS:
// [GUIDE] 1. Vite uses esbuild to transpile TypeScript files to JavaScript
// [GUIDE] 2. TypeScript configuration is inherited from packages/tsconfig
// [GUIDE] 3. Type checking happens separately via the "type-check" task in Turborepo
// [GUIDE] 4. The build process uses tsconfig.json in this directory for local settings

export default withPageConfig({
  // [GUIDE] Path resolution and aliases configuration
  resolve: {
    alias: {
      // [GUIDE] IMPORTANT: Maps @src/ imports to the src directory
      // [GUIDE] This allows imports like: import Component from '@src/Component'
      '@src': srcDir,
    },
  },
  
  // [GUIDE] Static assets directory (images, etc.)
  publicDir: resolve(rootDir, 'public'),
  
  // [GUIDE] Build output configuration
  build: {
    // [GUIDE] IMPORTANT: Output directory where the built files will be placed
    // [GUIDE] This follows the expected structure for Chrome extensions
    outDir: resolve(rootDir, '..', '..', 'dist', 'new-tab'),
  },
});
