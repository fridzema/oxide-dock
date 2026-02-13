import { useDark, useToggle } from '@vueuse/core'

export function useDarkMode() {
  const isDark = useDark({ disableTransition: false })
  const toggleDark = useToggle(isDark)
  return { isDark, toggleDark }
}
