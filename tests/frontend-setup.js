// Frontend test setup for Vitest
import { vi } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

// Mock DOM APIs that might not be available in JSDOM
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000'
  },
  writable: true
});

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  fetch.mockClear?.();
});