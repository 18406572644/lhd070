<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { get, put, download } from '@/utils/api'
import { Download, Filter } from 'lucide-vue-next'

interface User {
  id: number | string
  username: string
  email: string
  role: string
  banned: boolean
}

const users = ref<User[]>([])
const loading = ref(false)
const exportLoading = ref(false)
const roleLoading = ref<number | string | null>(null)
const banLoading = ref<number | string | null>(null)
const filterVisible = ref(false)

const filters = reactive({
  role: '',
  banned: '',
  format: 'xlsx',
})

const roles = [
  { value: 'user', label: '普通用户' },
  { value: 'merchant', label: '商家' },
  { value: 'admin', label: '管理员' },
]

const roleOptions = [
  { value: '', label: '全部角色' },
  { value: 'user', label: '普通用户' },
  { value: 'merchant', label: '商家' },
  { value: 'admin', label: '管理员' },
]

const bannedOptions = [
  { value: '', label: '全部状态' },
  { value: 'false', label: '正常' },
  { value: 'true', label: '已封禁' },
]

const formatOptions = [
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'csv', label: 'CSV (.csv)' },
]

const roleTagType: Record<string, string> = {
  admin: 'danger',
  merchant: 'warning',
  user: '',
}

async function fetchUsers() {
  loading.value = true
  try {
    const data = await get<{ items: User[]; pagination: { total: number } }>('/users')
    users.value = data.items || []
  } finally {
    loading.value = false
  }
}

async function handleExport() {
  exportLoading.value = true
  try {
    const params: Record<string, unknown> = { format: filters.format }
    if (filters.role) params.role = filters.role
    if (filters.banned !== '') params.banned = filters.banned
    await download('/export/users', params)
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败')
  } finally {
    exportLoading.value = false
  }
}

function resetFilters() {
  filters.role = ''
  filters.banned = ''
  filters.format = 'xlsx'
}

async function changeRole(user: User, role: string) {
  roleLoading.value = user.id
  try {
    await put(`/users/${user.id}/role`, { role })
    user.role = role
    ElMessage.success('角色已更新')
  } finally {
    roleLoading.value = null
  }
}

async function toggleBan(user: User) {
  banLoading.value = user.id
  try {
    const banned = !user.banned
    await put(`/users/${user.id}/ban`, { banned })
    user.banned = banned
    ElMessage.success(banned ? '用户已封禁' : '用户已解封')
  } finally {
    banLoading.value = null
  }
}

onMounted(fetchUsers)
</script>

<template>
  <div class="admin-users animate-fade-in">
    <div class="page-header">
      <h2 class="section-title">用户管理</h2>
      <div class="header-actions">
        <el-button type="primary" plain @click="filterVisible = !filterVisible">
          <el-icon><Filter /></el-icon>
          筛选导出
        </el-button>
      </div>
    </div>

    <el-collapse-transition>
      <div v-show="filterVisible" class="filter-panel cyber-card">
        <el-form :inline="true" label-position="top">
          <el-form-item label="用户角色">
            <el-select v-model="filters.role" placeholder="全部角色" style="width: 140px">
              <el-option v-for="opt in roleOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="账号状态">
            <el-select v-model="filters.banned" placeholder="全部状态" style="width: 140px">
              <el-option v-for="opt in bannedOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="导出格式">
            <el-select v-model="filters.format" style="width: 140px">
              <el-option v-for="opt in formatOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="exportLoading" @click="handleExport">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-collapse-transition>

    <el-table v-loading="loading" :data="users" stripe>
      <el-table-column label="用户名" prop="username" min-width="140">
        <template #default="{ row }">
          <span :class="{ banned: row.banned }">{{ row.username }}</span>
        </template>
      </el-table-column>
      <el-table-column label="邮箱" prop="email" min-width="200" />
      <el-table-column label="角色" width="140" align="center">
        <template #default="{ row }">
          <el-tag :type="roleTagType[row.role]" size="small" effect="dark">
            {{ roles.find((r) => r.value === row.role)?.label || row.role }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.banned ? 'danger' : 'success'" size="small" effect="dark">
            {{ row.banned ? '已封禁' : '正常' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="更改角色" width="150" align="center">
        <template #default="{ row }">
          <el-select
            :model-value="row.role"
            size="small"
            :loading="roleLoading === row.id"
            @change="(val: string) => changeRole(row, val)"
          >
            <el-option v-for="r in roles" :key="r.value" :label="r.label" :value="r.value" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" align="center">
        <template #default="{ row }">
          <el-button
            :type="row.banned ? 'success' : 'danger'"
            size="small"
            plain
            :loading="banLoading === row.id"
            @click="toggleBan(row)"
          >
            {{ row.banned ? '解封' : '封禁' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.admin-users {
  padding: 2rem 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.filter-panel {
  margin-bottom: 1rem;
  padding: 1rem 1.5rem;
}

.banned {
  color: var(--cc-danger);
  text-decoration: line-through;
}
</style>
