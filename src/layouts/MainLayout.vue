<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const cart = useCartStore()

const isLoggedIn = computed(() => auth.isLoggedIn)
const userRole = computed(() => auth.user?.role)
const cartCount = computed(() => cart.totalCount)

onMounted(() => {
  if (isLoggedIn.value) {
    cart.fetchCart()
  }
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

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

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
  flex: 1;
  justify-content: center;
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
