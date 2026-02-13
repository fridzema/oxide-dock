<script setup lang="ts">
import { useCounterStore } from '../stores/counter'
import NotificationDemo from '../components/NotificationDemo.vue'
import ClipboardDemo from '../components/ClipboardDemo.vue'
import FileDialogDemo from '../components/FileDialogDemo.vue'
import SystemInfoDemo from '../components/SystemInfoDemo.vue'

const counter = useCounterStore()

const techStack = ['Tauri v2', 'Vue 3', 'TypeScript', 'Tailwind CSS v4', 'Pinia', 'Tauri Plugins']
</script>

<template>
  <div class="mx-auto flex max-w-2xl flex-col items-center gap-10 py-8">
    <!-- Hero Section -->
    <section class="flex flex-col items-center gap-4 text-center">
      <div class="flex items-center gap-4">
        <img src="/icon.svg" alt="OxideDock logo" class="size-16" />
        <h1
          class="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent dark:from-blue-400 dark:to-violet-400"
        >
          OxideDock
        </h1>
      </div>
      <p class="max-w-md text-lg text-gray-600 dark:text-gray-400">
        Raw speed, refined desktop. OxideDock is powered by
        <span class="font-medium text-gray-900 dark:text-gray-200">Tauri</span>,
        <span class="font-medium text-gray-900 dark:text-gray-200">Vue</span>, and
        <span class="font-medium text-gray-900 dark:text-gray-200">TypeScript</span>.
      </p>
    </section>

    <!-- Counter Card -->
    <section
      class="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <div class="flex flex-col items-center gap-4">
        <span class="font-mono text-5xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{{
          counter.count
        }}</span>
        <p class="text-sm text-gray-500 dark:text-gray-400">Double: {{ counter.doubleCount }}</p>
        <div class="flex items-center gap-3">
          <button
            aria-label="Decrement counter"
            class="rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white transition hover:bg-blue-600 active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-500"
            @click="counter.decrement"
          >
            -
          </button>
          <button
            aria-label="Increment counter"
            class="rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white transition hover:bg-blue-600 active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-500"
            @click="counter.increment"
          >
            +
          </button>
        </div>
        <button
          class="text-sm text-gray-400 transition hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          @click="counter.reset"
        >
          Reset
        </button>
      </div>
    </section>

    <!-- Native Features Grid -->
    <section class="flex w-full flex-col gap-4">
      <h2 class="text-center text-lg font-semibold text-gray-900 dark:text-gray-100">
        Native Features
      </h2>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NotificationDemo />
        <ClipboardDemo />
        <FileDialogDemo />
        <SystemInfoDemo />
      </div>
    </section>

    <!-- Tech Stack Pills -->
    <section class="flex flex-wrap justify-center gap-2">
      <span
        v-for="tech in techStack"
        :key="tech"
        class="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400"
      >
        {{ tech }}
      </span>
    </section>
  </div>
</template>
