# Chrome Extension Migration Plan: JS to TypeScript

## Goals

- Migrate the existing JavaScript Chrome extension to the TypeScript template
- Keep the new tab functionality lightweight without React
- Follow TypeScript best practices
- Maintain all existing functionality
- Leverage the boilerplate structure where appropriate

## Phase 1: Analysis and Preparation

1. **Core Functionality Identification**
   - Random URL selection based on weighted probability
   - Options page for managing URL list with weights
   - New tab page with redirection
   - Storage management for URL data
   - Backward compatibility with old data format

2. **Project Structure Alignment**
   - Map JS project components to TS template structure:
     - `newtab.html/js` → Keep as pure HTML/TS without React in `/pages/new-tab/`
     - `options/` → `/pages/options/` (can use React for better UX)
     - `background.js` → `/chrome-extension/src/background/`
     - Storage management → `/packages/storage/`

## Phase 2: Core Data Management Implementation

1. **Create Storage Model**
   - Create a new TypeScript interface for the weighted URL data model:
     ```typescript
     interface WeightedUrl {
       url: string;
       weight: number;
     }
     ```
   - Create a storage implementation in `/packages/storage/lib/impl/weightedUrlsStorage.ts`
   - Implement data migration from old format

2. **Background Service Implementation**
   - Implement initialization logic in `/chrome-extension/src/background/index.ts`
   - Add migration handling for old format data
   - Set up options page opening when extension icon is clicked

## Phase 3: New Tab Page Implementation (Lightweight)

1. **New Tab HTML/TS Structure**
   - Create simple HTML template (similar to the original)
   - Implement pure TypeScript module for functionality without React
   - Maintain the loading spinner UI while redirect is processing
   - Add fallback for when no URLs are configured

2. **Weighted Random Algorithm**
   - Convert the existing algorithm to TypeScript
   - Optimize for performance since this runs on every new tab
   - Keep URL protocol normalization logic

## Phase 4: Options Page Implementation

1. **Options UI Components**
   - Use React for the options page for better UX
   - Create components for URL form and list display
   - Implement edit/delete functionality

2. **State Management**
   - Use the shared storage implementation for data persistence
   - Set up live updates when changes are made

## Phase 5: Testing and Refinement

1. **Unit Testing**
   - Test the weighted random selection algorithm
   - Validate storage functionality and migration logic
   - Verify URL protocol normalization

2. **Integration Testing**
   - Test the complete flow from options to new tab
   - Verify storage updates work correctly
   - Test edge cases (empty list, invalid URLs)

## Phase 6: Optimization and Enhancement

1. **Code Optimization**
   - Leverage TypeScript types for improved safety
   - Add proper error handling throughout
   - Minimize bundle size for the new tab page

2. **UI Improvements**
   - Enhance options page with Tailwind CSS
   - Ensure new tab page loads and redirects quickly

## Implementation Steps

1. Create the storage implementation
2. Implement the background service
3. Create the lightweight new tab page
4. Develop the React-based options page
5. Test and refine the implementation
6. Final optimization and documentation

## Note on Approach

- The new tab page will be kept as lightweight as possible using vanilla TypeScript
- The options page can use React for better UX since it's not performance-critical
- We'll reuse the storage implementation from the boilerplate where possible
- All code will follow TypeScript best practices with proper typing
