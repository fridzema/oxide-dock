<script setup lang="ts">
import { ref } from 'vue'
import { writeText, readText } from '@tauri-apps/plugin-clipboard-manager'

const textToWrite = ref('Hello from Tauri clipboard!')
const clipboardContent = ref<string | null>(null)
const status = ref<{ message: string; error: boolean } | null>(null)

async function copy() {
  try {
    await writeText(textToWrite.value)
    status.value = { message: 'Copied!', error: false }
  } catch (e) {
    status.value = { message: String(e), error: true }
  }
}

async function read() {
  try {
    const text = await readText()
    clipboardContent.value = text || '(empty)'
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
          d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
        />
      </svg>
      <h3 class="font-semibold text-gray-900 dark:text-gray-100">Clipboard</h3>
    </div>
    <p class="text-sm text-gray-500 dark:text-gray-400">Read and write system clipboard</p>
    <div class="flex gap-2">
      <label for="clipboard-text" class="sr-only">Text to copy</label>
      <input
        id="clipboard-text"
        v-model="textToWrite"
        type="text"
        placeholder="Text to copy"
        class="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
      />
      <button
        class="rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-600 active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-500"
        @click="copy"
      >
        Copy
      </button>
    </div>
    <button
      class="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 active:scale-95 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      @click="read"
    >
      Read Clipboard
    </button>
    <p
      v-if="clipboardContent !== null"
      class="rounded-lg bg-gray-50 px-3 py-2 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
    >
      {{ clipboardContent }}
    </p>
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
