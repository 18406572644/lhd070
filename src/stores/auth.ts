import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { get, post } from '@/utils/api'

interface User {
  id: number | string
  username: string
  email: string
  role: string
  avatar: string
  banned: boolean
}

const TOKEN_KEY = 'cybercraft_token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref('')
  const user = ref<User | null>(null)
  const loading = ref(false)

  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isMerchant = computed(() => user.value?.role === 'merchant')
  const role = computed(() => user.value?.role ?? '')

  async function init() {
    const saved = localStorage.getItem(TOKEN_KEY)
    if (!saved) return
    token.value = saved
    loading.value = true
    try {
      const data = await get<{ user: User }>('/auth/me')
      user.value = data.user
    } catch {
      token.value = ''
      user.value = null
      localStorage.removeItem(TOKEN_KEY)
    } finally {
      loading.value = false
    }
  }

  async function login(username: string, password: string) {
    loading.value = true
    try {
      const data = await post<{ token: string; user: User }>('/auth/login', {
        username,
        password,
      })
      token.value = data.token
      user.value = data.user
      localStorage.setItem(TOKEN_KEY, data.token)
    } finally {
      loading.value = false
    }
  }

  async function register(
    username: string,
    email: string,
    password: string,
    role?: string,
  ) {
    loading.value = true
    try {
      const payload: Record<string, string> = { username, email, password }
      if (role) payload.role = role
      const data = await post<{ token: string; user: User }>('/auth/register', payload)
      token.value = data.token
      user.value = data.user
      localStorage.setItem(TOKEN_KEY, data.token)
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
  }

  function updateUser(data: Partial<User>) {
    if (!user.value) return
    Object.assign(user.value, data)
  }

  return {
    token,
    user,
    loading,
    isLoggedIn,
    isAdmin,
    isMerchant,
    role,
    init,
    login,
    register,
    logout,
    updateUser,
  }
})
