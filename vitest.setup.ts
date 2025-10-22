import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'

// Mock environment variables
beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
  process.env.OPENAI_API_KEY = 'test-openai-key'
})

// Cleanup after each test
afterEach(() => {
  // Reset mocks
})

afterAll(() => {
  // Final cleanup
})
