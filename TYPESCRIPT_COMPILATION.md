# TypeScript Compilation in the Chrome Extension

## [GUIDE] Overview of TypeScript Configuration

This project uses a hierarchical TypeScript configuration system:

1. Base configuration in `/packages/tsconfig/base.json` defines common settings
2. Project-specific configurations in each package/page extend the base
3. TypeScript compilation is handled by Vite using esbuild

## [GUIDE] TypeScript Compilation Process

### [GUIDE] 1. Development Mode

When you run `pnpm dev`:

1. Turborepo orchestrates the build process (defined in `turbo.json`)
2. The `dev` task runs on each package based on dependencies
3. For the New Tab page:
   - Vite uses esbuild to transpile TypeScript to JavaScript
   - Type checking happens in watch mode
   - HMR (Hot Module Replacement) is enabled

### [GUIDE] 2. Production Build

When you run `pnpm build`:

1. Turborepo runs the `build` task with the proper dependency order
2. The `type-check` task runs first to verify types
3. Vite builds each package:
   - TypeScript files are transpiled to JavaScript
   - Code is minified and optimized
   - Output is placed in the specified directories

## [GUIDE] Key TypeScript Configuration Files

### [GUIDE] Root Configuration

`/tsconfig.json` - The root configuration file that:
- Sets up ESLint integration
- Extends the base configuration
- Is mainly used for TypeScript tooling

### [GUIDE] Base Configuration

`/packages/tsconfig/base.json` - Defines core TypeScript settings:
- Target: ESNext (latest ECMAScript features)
- Module: ESNext (latest module syntax)
- Strict type checking
- JSX support for React components
- DOM and ESNext library types

### [GUIDE] Page-specific Configuration

Each page has its own `tsconfig.json` that:
- Extends the base configuration
- Sets up path aliases
- Includes Chrome and Node types
- Configures page-specific settings

## [GUIDE] Build Process Integration

1. **TypeScript Checking**:
   - The `type-check` task in Turborepo validates all TypeScript code
   - Errors block the build process

2. **Vite + esbuild**:
   - Vite uses esbuild for fast TypeScript transpilation
   - Type checking is separate from transpilation for speed
   - This is configured in each page's `vite.config.mts` file

3. **Chrome Extension Integration**:
   - Built JavaScript files are output to the extension structure
   - The manifest is generated from the TypeScript definition

## [GUIDE] Best Practices

1. Always run `pnpm type-check` before committing code
2. Use the proper types imported from `@types/chrome`
3. Follow the path aliases set up in each tsconfig.json
4. Keep the TypeScript configurations in sync when adding new features
