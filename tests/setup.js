// Test database setup
process.env.NODE_ENV = 'test';

// Set test timeout
jest.setTimeout(10000);

// Global test cleanup
afterEach(() => {
  jest.clearAllMocks();
});