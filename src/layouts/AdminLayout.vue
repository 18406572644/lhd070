<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const userRole = computed(() => auth.user?.role)
const isMerchant = computed(() => userRole.value === 'merchant')
const isAdmin = computed(() => userRole.value === 'admin')

const merchantMenuItems = [
  { index: '/merchant', label: '仪表盘', icon: 'Odometer' },
  { index: '/merchant/products', label: '配件管理', icon: 'Goods' },
  { index: '/merchant/orders', label: '订单处理', icon: 'Document' },
  { index: '/merchant/inventory', label: '库存管理', icon: 'Box' },
]

const adminMenuItems = [
  { index: '/admin', label: '仪表盘', icon: 'Odometer' },
  { index: '/admin/users', label: '用户管理', icon: 'User' },
  { index: '/admin/statistics', label: '数据统计', icon: 'DataLine' },
  { index: '/admin/inventory', label: '库存监控', icon: 'Box' },
]

const menuItems = computed(() => {
  const isMerchantRoute = route.path.startsWith('/merchant')
  if (isMerchantRoute) return merchantMenuItems
  return adminMenuItems
})

const layoutTitle = computed(() => {
  const isMerchantRoute = route.path.startsWith('/merchant')
  return isMerchantRoute ? '商家后台' : '管理后台'
})

const pageTitle = computed(() => {
  const item = menuItems.value.find((m) => m.index === route.path)
  return item?.label ?? ''
})

const handleMenuSelect = (index: string) => {
  router.push(index)
}

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="sidebar-logo" @click="goHome">
        <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <line x1="6" y1="10" x2="6" y2="10.01" />
          <line x1="10" y1="10" x2="10" y2="10.01" />
          <line x1="14" y1="10" x2="14" y2="10.01" />
          <line x1="18" y1="10" x2="18" y2="10.01" />
          <line x1="8" y1="14" x2="16" y2="14" />
        </svg>
        <span class="logo-text">CYBERCRAFT</span>
      </div>

      <el-menu
        :default-active="route.path"
        class="sidebar-menu"
        background-color="#0d1321"
        text-color="#8892a4"
        active-text-color="#00ffff"
        @select="handleMenuSelect"
      >
        <el-menu-item v-for="item in menuItems" :key="item.index" :index="item.index">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </el-menu>
    </aside>

    <div class="main-area">
      <header class="top-header">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>{{ layoutTitle }}</el-breadcrumb-item>
          <el-breadcrumb-item v-if="pageTitle">{{ pageTitle }}</el-breadcrumb-item>
        </el-breadcrumb>

        <div class="header-user">
          <el-avatar :size="28" class="user-avatar">
            {{ auth.user?.username?.charAt(0)?.toUpperCase() }}
          </el-avatar>
          <span class="user-name">{{ auth.user?.username }}</span>
        </div>
      </header>

      <main class="admin-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #0a0e17;
  color: #e0e0e0;
}

.sidebar {
  width: 220px;
  background: #0d1321;
  border-right: 1px solid rgba(0, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  border-bottom: 1px solid rgba(0, 255, 255, 0.1);
  flex-shrink: 0;
}

.logo-icon {
  width: 22px;
  height: 22px;
  color: #00ffff;
}

.logo-text {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 20px;
  color: #00ffff;
  letter-spacing: 2px;
}

.sidebar-menu {
  border-right: none;
  flex: 1;
}

.sidebar-menu .el-menu-item {
  height: 48px;
  line-height: 48px;
}

.sidebar-menu .el-menu-item.is-active {
  background: rgba(0, 255, 255, 0.08) !important;
  border-right: 3px solid #00ffff;
}

.sidebar-menu .el-menu-item:hover {
  background: rgba(0, 255, 255, 0.05) !important;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.top-header {
  height: 60px;
  background: #0d1321;
  border-bottom: 1px solid rgba(0, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}

.top-header :deep(.el-breadcrumb__inner) {
  color: #8892a4;
}

.top-header :deep(.el-breadcrumb__inner.is-link) {
  color: #8892a4;
}

.top-header :deep(.el-breadcrumb__inner.is-link:hover) {
  color: #00ffff;
}

.top-header :deep(.el-breadcrumb__separator) {
  color: #4a5568;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  background: linear-gradient(135deg, #00ffff, #0088aa);
  color: #0a0e17;
  font-weight: 600;
}

.user-name {
  font-size: 14px;
}

.admin-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}
</style>
