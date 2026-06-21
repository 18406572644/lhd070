<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { get, put } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'

interface RecentOrder {
  id: number | string
  orderNo: string
  status: string
  totalAmount: number
  createdAt: string
}

const authStore = useAuthStore()
const nickname = ref('')
const email = ref('')
const editing = ref(false)
const saving = ref(false)
const recentOrders = ref<RecentOrder[]>([])
const ordersLoading = ref(false)

const user = computed(() => authStore.user)

const roleLabel: Record<string, string> = {
  admin: '管理员',
  merchant: '商家',
  user: '普通用户',
}

const roleTagType: Record<string, string> = {
  admin: 'danger',
  merchant: 'warning',
  user: '',
}

const statusLabel: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  processing: '处理中',
  completed: '已完成',
  cancelled: '已取消',
}

function startEdit() {
  nickname.value = user.value?.username ?? ''
  email.value = user.value?.email ?? ''
  editing.value = true
}

function cancelEdit() {
  editing.value = false
}

async function saveProfile() {
  saving.value = true
  try {
    await put('/auth/profile', { nickname: nickname.value, email: email.value })
    authStore.updateUser({ username: nickname.value, email: email.value })
    ElMessage.success('资料已更新')
    editing.value = false
  } finally {
    saving.value = false
  }
}

async function fetchRecentOrders() {
  ordersLoading.value = true
  try {
    const data = await get<{ orders: RecentOrder[]; total: number }>('/orders', { pageSize: 5 })
    recentOrders.value = (data.orders || []).slice(0, 5)
  } finally {
    ordersLoading.value = false
  }
}

onMounted(fetchRecentOrders)
</script>

<template>
  <div class="profile-page animate-fade-in">
    <h2 class="section-title">个人中心</h2>

    <div class="profile-card cyber-card">
      <div class="avatar-section">
        <el-avatar :size="72" :src="user?.avatar">
          {{ user?.username?.charAt(0)?.toUpperCase() }}
        </el-avatar>
        <div class="user-meta">
          <h3 class="username">{{ user?.username }}</h3>
          <el-tag :type="roleTagType[user?.role ?? '']" size="small" effect="dark">
            {{ roleLabel[user?.role ?? ''] || user?.role }}
          </el-tag>
        </div>
      </div>

      <el-divider />

      <div v-if="!editing" class="info-display">
        <div class="info-row">
          <span class="info-label">昵称</span>
          <span class="info-value">{{ user?.username }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">邮箱</span>
          <span class="info-value">{{ user?.email }}</span>
        </div>
        <el-button type="primary" plain @click="startEdit">编辑资料</el-button>
      </div>

      <el-form v-else label-position="top" class="edit-form">
        <el-form-item label="昵称">
          <el-input v-model="nickname" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="email" />
        </el-form-item>
        <div class="form-actions">
          <el-button @click="cancelEdit">取消</el-button>
          <el-button type="primary" :loading="saving" @click="saveProfile">保存</el-button>
        </div>
      </el-form>
    </div>

    <div class="recent-orders cyber-card">
      <h3 class="sub-title">最近订单</h3>
      <el-table v-loading="ordersLoading" :data="recentOrders" stripe>
        <el-table-column label="订单号" prop="orderNo">
          <template #default="{ row }">
            <span class="cyan">{{ row.orderNo }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" effect="dark">{{ statusLabel[row.status] || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">¥{{ row.totalAmount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="时间" prop="createdAt" width="180" />
      </el-table>
      <el-empty v-if="!ordersLoading && recentOrders.length === 0" description="暂无订单" />
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.username {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.25rem;
  color: var(--cc-white);
}

.info-display {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 0.85rem;
  color: var(--cc-text-dim);
}

.info-value {
  font-size: 0.95rem;
  color: var(--cc-text);
}

.edit-form {
  max-width: 400px;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
}

.sub-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--cc-white);
  margin-bottom: 1rem;
}

.cyan {
  color: var(--cc-cyan);
  font-family: 'Rajdhani', sans-serif;
  font-weight: 600;
}

.amount {
  color: var(--cc-cyan);
  font-weight: 600;
}
</style>
