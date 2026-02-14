import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { error as logError } from '@tauri-apps/plugin-log'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.config.errorHandler = (err) => {
  const msg = err instanceof Error ? err.message : String(err)
  console.error('Unhandled Vue error:', err)
  logError(`Unhandled Vue error: ${msg}`).catch(() => {})
}

window.addEventListener('unhandledrejection', (event) => {
  const msg = event.reason instanceof Error ? event.reason.message : String(event.reason)
  console.error('Unhandled promise rejection:', event.reason)
  logError(`Unhandled promise rejection: ${msg}`).catch(() => {})
})

app.mount('#app')
