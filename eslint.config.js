import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// Note: eslint-config-next is not used here — it depends on eslint-plugin-react
// 7.x, which crashes under ESLint 10. The rules that matter for this codebase
// (TypeScript correctness, hook rules) are covered directly.
export default defineConfig([
  globalIgnores(['.next', 'data', 'next-env.d.ts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended, reactHooks.configs.flat.recommended],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
])
