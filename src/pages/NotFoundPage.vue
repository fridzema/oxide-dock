<template>
  <div class="flex flex-col items-center gap-4 py-16">
    <span class="text-6xl font-bold text-gray-300 dark:text-gray-700">404</span>
    <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Page not found</h1>
    <p class="text-gray-500 dark:text-gray-400">The page you're looking for doesn't exist.</p>
    <RouterLink
      to="/"
      class="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
    >
      Go home
    </RouterLink>
  </div>
</template>
