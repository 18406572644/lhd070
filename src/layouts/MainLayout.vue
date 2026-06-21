<script setup lang="ts">
import { computed, onMounted, ref, watch, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useProductsStore, type Product } from '@/stores/products'
import { useCompareStore } from '@/stores/compare'
import CompareBar from '@/components/CompareBar.vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const cart = useCartStore()
const productsStore = useProductsStore()
const compareStore = useCompareStore()

const isLoggedIn = computed(() => auth.isLoggedIn)
const userRole = computed(() => auth.user?.role)
const cartCount = computed(() => cart.totalCount)

const searchKeyword = ref('')
const searchSuggestions = ref<Product[]>([])
const showSuggestions = ref(false)
const searchLoading = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)
let searchTimer: ReturnType<typeof setTimeout> | null = null

function clearSearchTimer() {
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
}

watch(searchKeyword, (val) => {
  clearSearchTimer()
  if (!val.trim()) {
    searchSuggestions.value = []
    showSuggestions.value = false
    return
  }
  searchTimer = setTimeout(async () => {
    searchLoading.value = true
    try {
      searchSuggestions.value = await productsStore.searchSuggestions(val.trim(), 8)
      showSuggestions.value = searchSuggestions.value.length > 0
    } finally {
      searchLoading.value = false
    }
  }, 300)
})

function handleSearchFocus() {
  if (searchKeyword.value.trim() && searchSuggestions.value.length > 0) {
    showSuggestions.value = true
  }
}

function handleSearchBlur() {
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

function goProductDetail(id: number | string) {
  showSuggestions.value = false
  searchKeyword.value = ''
  router.push(`/products/${id}`)
}

function goSearchResults() {
  const keyword = searchKeyword.value.trim()
  if (!keyword) return
  showSuggestions.value = false
  router.push({ path: '/products', query: { search: keyword } })
}

function handleSearchKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    goSearchResults()
  }
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as Node
  const searchContainer = document.querySelector('.search-container')
  if (searchContainer && !searchContainer.contains(target)) {
    showSuggestions.value = false
  }
}

onMounted(() => {
  if (isLoggedIn.value) {
    cart.fetchCart()
  }
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  clearSearchTimer()
  document.removeEventListener('click', handleClickOutside)
})

const handleLogout = () => {
  auth.logout()
  ElMessage.success('已退出登录')
  router.push('/')
}

const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'orders':
      router.push('/orders')
      break
    case 'favorites':
      router.push('/favorites')
      break
    case 'merchant':
      router.push('/merchant')
      break
    case 'admin':
      router.push('/admin')
      break
    case 'logout':
      handleLogout()
      break
  }
}

const isHomeActive = computed(() => route.path === '/')
const hasCompareBar = computed(() => compareStore.count > 0)
</script>

<template>
  <div class="main-layout">
    <header class="navbar">
      <div class="navbar-inner">
        <router-link to="/" class="logo">
          <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <line x1="6" y1="10" x2="6" y2="10.01" />
            <line x1="10" y1="10" x2="10" y2="10.01" />
            <line x1="14" y1="10" x2="14" y2="10.01" />
            <line x1="18" y1="10" x2="18" y2="10.01" />
            <line x1="8" y1="14" x2="16" y2="14" />
          </svg>
          <span class="logo-text">CYBERCRAFT</span>
        </router-link>

        <nav class="nav-links">
          <router-link to="/" class="nav-link" :class="{ active: isHomeActive }">首页</router-link>
          <router-link to="/products" class="nav-link">配件商城</router-link>
          <router-link to="/builder" class="nav-link">客制化组装</router-link>
        </nav>

        <div class="search-container">
          <div class="search-box">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref="searchInputRef"
              v-model="searchKeyword"
              type="text"
              class="search-input"
              placeholder="搜索配件名称、品牌..."
              @focus="handleSearchFocus"
              @blur="handleSearchBlur"
              @keydown="handleSearchKeydown"
            />
            <svg v-if="searchLoading" class="search-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <button
              v-if="searchKeyword && !searchLoading"
              class="search-clear"
              @mousedown.prevent="searchKeyword = ''; searchSuggestions = []; showSuggestions = false"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <transition name="dropdown">
            <div v-if="showSuggestions" class="search-dropdown">
              <div
                v-for="item in searchSuggestions"
                :key="item.id"
                class="suggestion-item"
                @mousedown.prevent="goProductDetail(item.id)"
              >
                <div class="suggestion-info">
                  <span class="suggestion-name">{{ item.name }}</span>
                  <span class="suggestion-category" v-if="item.categoryName">{{ item.categoryName }}</span>
                </div>
                <span class="suggestion-price">¥{{ item.price }}</span>
              </div>
              <div class="suggestion-footer" @mousedown.prevent="goSearchResults">
                <span>查看全部结果</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </div>
          </transition>
        </div>

        <div class="nav-right">
          <router-link to="/cart" class="cart-link">
            <el-badge :value="cartCount" :hidden="cartCount === 0" class="cart-badge">
              <svg class="cart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </el-badge>
          </router-link>

          <template v-if="isLoggedIn">
            <el-dropdown trigger="click" @command="handleCommand">
              <span class="user-trigger">
                <el-avatar :size="28" class="user-avatar">
                  {{ auth.user?.username?.charAt(0)?.toUpperCase() }}
                </el-avatar>
                <span class="user-name">{{ auth.user?.username }}</span>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                  <el-dropdown-item command="orders">我的订单</el-dropdown-item>
                  <el-dropdown-item command="favorites">收藏夹</el-dropdown-item>
                  <el-dropdown-item v-if="userRole === 'merchant'" command="merchant" divided>商家后台</el-dropdown-item>
                  <el-dropdown-item v-if="userRole === 'admin'" command="admin" divided>管理后台</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <div class="auth-buttons">
              <el-button type="primary" size="small" @click="router.push('/login')">登录</el-button>
              <el-button size="small" @click="router.push('/register')">注册</el-button>
            </div>
          </template>
        </div>
      </div>
    </header>

    <main class="main-content" :class="{ 'has-compare-bar': hasCompareBar }">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <CompareBar />

    <footer class="footer">
      <div class="footer-inner">
        <p>&copy; 2026 CYBERCRAFT. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0a0e17;
  color: #e0e0e0;
}

.navbar {
  background: #0d1321;
  border-bottom: 1px solid rgba(0, 255, 255, 0.15);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  gap: 32px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  flex-shrink: 0;
}

.logo-icon {
  width: 24px;
  height: 24px;
  color: #00ffff;
}

.logo-text {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 22px;
  color: #00ffff;
  letter-spacing: 2px;
}

.nav-links {
  display: flex;
  gap: 28px;
  flex-shrink: 0;
}

.search-container {
  flex: 1;
  max-width: 380px;
  position: relative;
  margin: 0 auto;
  z-index: 200;
}

.search-box {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 20px;
  padding: 0 12px;
  height: 36px;
  transition: all 0.2s;
}

.search-box:focus-within {
  border-color: rgba(0, 255, 255, 0.5);
  box-shadow: 0 0 0 2px rgba(0, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.5);
}

.search-icon {
  width: 16px;
  height: 16px;
  color: #5a6578;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #e0e0e0;
  font-size: 14px;
  padding: 0 8px;
  height: 100%;
}

.search-input::placeholder {
  color: #5a6578;
}

.search-spinner {
  width: 16px;
  height: 16px;
  color: #00ffff;
  flex-shrink: 0;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.search-clear {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  color: #5a6578;
  transition: color 0.2s;
}

.search-clear:hover {
  color: #e0e0e0;
}

.search-clear svg {
  width: 14px;
  height: 14px;
}

.search-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: #0d1321;
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.suggestion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.suggestion-item:last-of-type {
  border-bottom: none;
}

.suggestion-item:hover {
  background: rgba(0, 255, 255, 0.08);
}

.suggestion-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.suggestion-name {
  font-size: 14px;
  color: #e0e0e0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.suggestion-category {
  flex-shrink: 0;
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(0, 255, 255, 0.12);
  color: #00ffff;
  border-radius: 4px;
  border: 1px solid rgba(0, 255, 255, 0.2);
}

.suggestion-price {
  flex-shrink: 0;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 600;
  font-size: 15px;
  color: #00ffff;
}

.suggestion-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
  background: rgba(0, 255, 255, 0.04);
  border-top: 1px solid rgba(0, 255, 255, 0.1);
  color: #5a6578;
  font-size: 13px;
  transition: all 0.15s;
}

.suggestion-footer:hover {
  background: rgba(0, 255, 255, 0.08);
  color: #00ffff;
}

.suggestion-footer svg {
  width: 14px;
  height: 14px;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.nav-link {
  color: #8892a4;
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
  padding: 4px 0;
  position: relative;
  transition: color 0.2s;
}

.nav-link:hover,
.nav-link.router-link-active,
.nav-link.active {
  color: #00ffff;
}

.nav-link.router-link-active::after,
.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: #00ffff;
  border-radius: 1px;
  box-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.cart-link {
  color: #8892a4;
  transition: color 0.2s;
  text-decoration: none;
  display: flex;
  align-items: center;
}

.cart-link:hover {
  color: #00ffff;
}

.cart-icon {
  width: 22px;
  height: 22px;
}

.cart-badge :deep(.el-badge__content) {
  background: #00ffff;
  color: #0a0e17;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #e0e0e0;
}

.user-avatar {
  background: linear-gradient(135deg, #00ffff, #0088aa);
  color: #0a0e17;
  font-weight: 600;
}

.user-name {
  font-size: 14px;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.auth-buttons {
  display: flex;
  gap: 8px;
}

.auth-buttons .el-button--primary {
  --el-button-bg-color: #00cccc;
  --el-button-border-color: #00cccc;
  --el-button-hover-bg-color: #00ffff;
  --el-button-hover-border-color: #00ffff;
  --el-button-text-color: #0a0e17;
}

.auth-buttons .el-button--default {
  --el-button-text-color: #00ffff;
  --el-button-border-color: #00ffff;
  --el-button-hover-text-color: #00ffff;
  --el-button-hover-border-color: #00ffff;
  --el-button-bg-color: transparent;
}

.main-content {
  flex: 1;
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
  padding: 24px;
}

.main-content.has-compare-bar {
  padding-bottom: 90px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.footer {
  background: #0d1321;
  border-top: 1px solid rgba(0, 255, 255, 0.1);
  padding: 20px 24px;
}

.footer-inner {
  max-width: 1280px;
  margin: 0 auto;
  text-align: center;
  color: #4a5568;
  font-size: 13px;
}
</style>
