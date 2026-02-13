import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NotificationDemo from '../../src/components/NotificationDemo.vue'

vi.mock('@tauri-apps/plugin-notification', () => ({
  sendNotification: vi.fn(),
  isPermissionGranted: vi.fn().mockResolvedValue(true),
  requestPermission: vi.fn().mockResolvedValue('granted'),
}))

describe('NotificationDemo', () => {
  it('renders title and description', () => {
    const wrapper = mount(NotificationDemo)
    expect(wrapper.text()).toContain('Notifications')
    expect(wrapper.text()).toContain('Send native OS notifications')
  })

  it('has pre-filled input fields', () => {
    const wrapper = mount(NotificationDemo)
    const inputs = wrapper.findAll('input')
    expect(inputs.length).toBe(2)
    expect(inputs[0].element.value).toBe('Hello from Tauri!')
    expect(inputs[1].element.value).toBe('This is a native notification')
  })

  it('has a send button', () => {
    const wrapper = mount(NotificationDemo)
    const button = wrapper.find('button')
    expect(button.text()).toBe('Send Notification')
  })
})
