/**
 * KAAL - Test Setup Configuration
 * Global test setup for Vitest
 */

import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';

// Setup
beforeAll(() => {
  console.log('🧪 Starting KAAL test suite...');
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Teardown
afterAll(() => {
  console.log('✅ All tests completed!');
});

// Mock environment variables
process.env.VITE_SUPABASE_URL = 'https://test-project.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.VITE_GEMINI_API_KEY = 'test-gemini-key';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});

export {};
