<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  type as osType,
  version as osVersion,
  arch as osArch,
  platform as osPlatform,
} from '@tauri-apps/plugin-os'
import { openUrl } from '@tauri-apps/plugin-opener'

const info = ref<{ label: string; value: string }[]>([])

onMounted(() => {
  try {
    info.value = [
      { label: 'OS Type', value: osType() },
      { label: 'Version', value: osVersion() },
      { label: 'Architecture', value: osArch() },
      { label: 'Platform', value: osPlatform() },
    ]
  } catch {
    info.value = [{ label: 'Status', value: 'Requires Tauri runtime' }]
  }
})

const status = ref<{ message: string; error: boolean } | null>(null)

async function openGitHub() {
  try {
    await openUrl('https://github.com/nicepkg/oxidedock')
    status.value = { message: 'Opened in browser!', error: false }
  } catch (e) {
    status.value = { message: String(e), error: true }
  }
}
</script>

<template>
  <div
    class="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
  >
    <div class="flex items-center gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="size-5 text-blue-500"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z"
        />
      </svg>
      <h3 class="font-semibold text-gray-900 dark:text-gray-100">System Info</h3>
    </div>
    <p class="text-sm text-gray-500 dark:text-gray-400">OS details and open links</p>
    <div v-if="info.length" class="flex flex-col gap-1">
      <div v-for="item in info" :key="item.label" class="flex justify-between text-xs">
        <span class="text-gray-500 dark:text-gray-400">{{ item.label }}</span>
        <span class="font-mono text-gray-700 dark:text-gray-300">{{ item.value }}</span>
      </div>
    </div>
    <button
      class="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 active:scale-95 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      @click="openGitHub"
    >
      Open GitHub Repo
    </button>
    <p
      v-if="status"
      role="status"
      class="text-xs"
      :class="status.error ? 'text-red-500' : 'text-green-500 dark:text-green-400'"
    >
      {{ status.message }}
    </p>
  </div>
</template>
