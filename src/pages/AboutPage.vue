<script setup lang="ts">
const techStack = [
  { name: 'Tauri', version: 'v2', url: 'https://v2.tauri.app/', description: 'Desktop runtime' },
  { name: 'Vue', version: 'v3', url: 'https://vuejs.org/', description: 'Frontend framework' },
  { name: 'Vite', version: 'v7', url: 'https://vite.dev/', description: 'Build tool' },
  {
    name: 'TypeScript',
    version: 'v5',
    url: 'https://www.typescriptlang.org/',
    description: 'Type safety',
  },
  {
    name: 'Tailwind CSS',
    version: 'v4',
    url: 'https://tailwindcss.com/',
    description: 'Utility-first CSS',
  },
  {
    name: 'Pinia',
    version: 'v3',
    url: 'https://pinia.vuejs.org/',
    description: 'State management',
  },
  { name: 'VueUse', version: 'latest', url: 'https://vueuse.org/', description: 'Composables' },
]
</script>

<template>
  <div class="mx-auto flex max-w-xl flex-col items-center gap-8 py-8">
    <section class="flex flex-col items-center gap-3 text-center">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">About OxideDock</h1>
      <p class="max-w-md text-gray-600 dark:text-gray-400">
        A desktop application foundation built with Tauri v2, Vue 3, and Vite. Use it as a starting
        point for cross-platform desktop apps with native performance.
      </p>
      <p class="font-mono text-sm text-gray-400 dark:text-gray-500">v0.1.0</p>
    </section>

    <section class="w-full">
      <h2 class="mb-3 text-center text-lg font-semibold text-gray-900 dark:text-gray-100">
        Tech Stack
      </h2>
      <div class="flex flex-col gap-2">
        <a
          v-for="tech in techStack"
          :key="tech.name"
          :href="tech.url"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
        >
          <div>
            <span class="font-medium text-gray-900 dark:text-gray-100">{{ tech.name }}</span>
            <span class="ml-2 text-xs text-gray-400">{{ tech.description }}</span>
          </div>
          <span
            class="rounded-full bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400"
          >
            {{ tech.version }}
          </span>
        </a>
      </div>
    </section>
  </div>
</template>
