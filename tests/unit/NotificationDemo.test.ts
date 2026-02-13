import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import NotificationDemo from '../../src/components/NotificationDemo.vue'
import {
  sendNotification,
  isPermissionGranted,
  requestPermission,
} from '@tauri-apps/plugin-notification'

vi.mock('@tauri-apps/plugin-notification', () => ({
  sendNotification: vi.fn(),
  isPermissionGranted: vi.fn(),
  requestPermission: vi.fn(),
}))

describe('NotificationDemo', () => {
  beforeEach(() => {
    vi.mocked(sendNotification).mockClear()
    vi.mocked(isPermissionGranted).mockReset()
    vi.mocked(requestPermission).mockReset()
  })

  it('renders title and description', () => {
    const wrapper = mount(NotificationDemo)
    expect(wrapper.text()).toContain('Notifications')
    expect(wrapper.text()).toContain('Send native OS notifications')
  })

  it('has pre-filled input fields', () => {
    const wrapper = mount(NotificationDemo)
    const inputs = wrapper.findAll('input')
    expect(inputs).toHaveLength(2)
    expect(inputs[0].element.value).toBe('Hello from Tauri!')
    expect(inputs[1].element.value).toBe('This is a native notification')
  })

  it('has a send button', () => {
    const wrapper = mount(NotificationDemo)
    expect(wrapper.find('button').text()).toBe('Send Notification')
  })

  it('sends notification when permission already granted', async () => {
    vi.mocked(isPermissionGranted).mockResolvedValue(true)
    const wrapper = mount(NotificationDemo)

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(sendNotification).toHaveBeenCalledWith({
      title: 'Hello from Tauri!',
      body: 'This is a native notification',
    })
    expect(wrapper.find('[role="status"]').text()).toBe('Notification sent!')
    expect(wrapper.find('[role="status"]').classes()).toContain('text-green-500')
  })

  it('requests permission and sends when granted', async () => {
    vi.mocked(isPermissionGranted).mockResolvedValue(false)
    vi.mocked(requestPermission).mockResolvedValue('granted')
    const wrapper = mount(NotificationDemo)

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(requestPermission).toHaveBeenCalled()
    expect(sendNotification).toHaveBeenCalled()
    expect(wrapper.find('[role="status"]').text()).toBe('Notification sent!')
  })

  it('shows error when permission denied', async () => {
    vi.mocked(isPermissionGranted).mockResolvedValue(false)
    vi.mocked(requestPermission).mockResolvedValue('denied')
    const wrapper = mount(NotificationDemo)

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(sendNotification).not.toHaveBeenCalled()
    expect(wrapper.find('[role="status"]').text()).toBe('Permission denied')
    expect(wrapper.find('[role="status"]').classes()).toContain('text-red-500')
  })

  it('shows error when plugin throws', async () => {
    vi.mocked(isPermissionGranted).mockRejectedValue(new Error('Plugin error'))
    const wrapper = mount(NotificationDemo)

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="status"]').text()).toBe('Error: Plugin error')
    expect(wrapper.find('[role="status"]').classes()).toContain('text-red-500')
  })

  it('sends with updated input values', async () => {
    vi.mocked(isPermissionGranted).mockResolvedValue(true)
    const wrapper = mount(NotificationDemo)
    const inputs = wrapper.findAll('input')

    await inputs[0].setValue('Custom Title')
    await inputs[1].setValue('Custom Body')
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(sendNotification).toHaveBeenCalledWith({
      title: 'Custom Title',
      body: 'Custom Body',
    })
  })
})
