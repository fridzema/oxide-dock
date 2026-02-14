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
  console.error('Unhandled Vue error:', err)
  logError(`Unhandled Vue error: ${err}`).catch(() => {})
}

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  logError(`Unhandled promise rejection: ${event.reason}`).catch(() => {})
})

app.mount('#app')
