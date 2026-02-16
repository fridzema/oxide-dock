import pluginVue from 'eslint-plugin-vue'
import tsParser from '@typescript-eslint/parser'
import biomeConfig from 'eslint-config-biome'

export default [
  ...pluginVue.configs['flat/recommended'],
  biomeConfig,
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
      },
    },
    rules: {
      // False positive: ESLint cannot see template usage of script setup bindings
      'no-useless-assignment': 'off',
    },
  },
  {
    ignores: ['dist/', 'src-tauri/target/', 'node_modules/', 'coverage/'],
  },
]
