<script setup lang="ts">
import { ref } from 'vue'
import { open } from '@tauri-apps/plugin-dialog'
import { readTextFile } from '@tauri-apps/plugin-fs'

const filePath = ref<string | null>(null)
const fileContent = ref<string | null>(null)
const status = ref<{ message: string; error: boolean } | null>(null)

async function openFile() {
  try {
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: 'Text',
          extensions: [
            'txt',
            'md',
            'json',
            'ts',
            'js',
            'vue',
            'css',
            'html',
            'toml',
            'yaml',
            'yml',
          ],
        },
      ],
    })
    if (!selected) return

    filePath.value = selected
    const content = await readTextFile(selected)
    if (content.length > 500) {
      fileContent.value = content.slice(0, 500) + '\n… (truncated)'
    } else {
      fileContent.value = content
    }
    status.value = null
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
          d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776"
        />
      </svg>
      <h3 class="font-semibold text-gray-900 dark:text-gray-100">File Dialog</h3>
    </div>
    <p class="text-sm text-gray-500 dark:text-gray-400">Open files with native dialogs</p>
    <button
      class="rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-600 active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-500"
      @click="openFile"
    >
      Open File
    </button>
    <div v-if="filePath" class="flex flex-col gap-1">
      <p class="text-xs text-gray-500 dark:text-gray-400">
        Path: <span class="font-mono">{{ filePath }}</span>
      </p>
      <pre
        v-if="fileContent"
        class="max-h-32 overflow-auto rounded-lg bg-gray-50 p-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
        >{{ fileContent }}</pre
      >
    </div>
    <p
      v-if="status"
      class="text-xs"
      :class="status.error ? 'text-red-500' : 'text-green-500 dark:text-green-400'"
    >
      {{ status.message }}
    </p>
  </div>
</template>
