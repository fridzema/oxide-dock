<script setup lang="ts">
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification'
import { ref } from 'vue'

const title = ref('Hello from Tauri!')
const body = ref('This is a native notification')
const status = ref<{ message: string; error: boolean } | null>(null)

async function send() {
  try {
    let granted = await isPermissionGranted()
    if (!granted) {
      const permission = await requestPermission()
      granted = permission === 'granted'
    }
    if (granted) {
      sendNotification({ title: title.value, body: body.value })
      status.value = { message: 'Notification sent!', error: false }
    } else {
      status.value = { message: 'Permission denied', error: true }
    }
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
          d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
        />
      </svg>
      <h3 class="font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
    </div>
    <p class="text-sm text-gray-500 dark:text-gray-400">Send native OS notifications</p>
    <label for="notification-title" class="sr-only">Notification title</label>
    <input
      id="notification-title"
      v-model="title"
      type="text"
      placeholder="Title"
      class="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
    />
    <label for="notification-body" class="sr-only">Notification body</label>
    <input
      id="notification-body"
      v-model="body"
      type="text"
      placeholder="Body"
      class="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
    />
    <button
      class="rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-600 active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-500"
      @click="send"
    >
      Send Notification
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
