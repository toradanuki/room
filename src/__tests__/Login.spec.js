import { shallowMount } from '@vue/test-utils';
import Login from './Login.vue';

describe('Login.vue', () => {
  it('renders login form correctly', () => {
    const wrapper = shallowMount(Login)
    expect(wrapper.find('.login-form').exists()).toBe(true)
    expect(wrapper.find('.login-title').text()).toBe('Login')
    expect(wrapper.find('v-text-field[label="E-mail"]').exists()).toBe(true)
    expect(wrapper.find('v-text-field[label="Password"]').exists()).toBe(true)
    expect(wrapper.find('.login-btn').text()).toBe('Login')
  })

  it('displays error message when login fails', () => {
    const wrapper = shallowMount(Login)
    wrapper.setData({ email: 'test@example.com', password: 'password' })
    wrapper.vm.submit()
    expect(wrapper.find('.error-message').exists()).toBe(true)
    expect(wrapper.find('.error-message').text()).toBe('ログインに失敗しました')
  })

  it('redirects to home page after successful login', () => {
    const wrapper = shallowMount(Login)
    const mockUser = {
      displayName: 'Test User',
      email: 'test@example.com',
      uid: '123456789',
      refreshToken: 'abcdefg',
      photoURL: 'https://example.com/avatar.jpg'
    }
    const mockRouter = {
      push: jest.fn()
    }
    wrapper.setData({ email: 'test@example.com', password: 'password' })
    wrapper.vm.$router = mockRouter
    wrapper.vm.$router.push.mockClear()
    wrapper.vm.submit()
    expect(sessionStorage.getItem('user')).toBe(JSON.stringify(mockUser))
    expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/')
  })
})