import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Vitest runs without globals here, so Testing Library's automatic teardown
// does not register itself. Unmount explicitly between tests.
afterEach(cleanup)
