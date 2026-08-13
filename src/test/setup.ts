import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

beforeEach(() => {
  window.localStorage.clear()
})

// Vitest reuses a jsdom document within a worker.  Unmount every rendered UI
// so a test cannot find controls left by a preceding one.
afterEach(cleanup)
