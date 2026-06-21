<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { get, put } from '@/utils/api'

interface User {
  id: number | string
  username: string
  email: string
  role: string
  banned: boolean
}

const users = ref<User[]>([])
const loading = ref(false)
const roleLoading = ref<number | string | null>(null)
const banLoading = ref<number | string | null>(null)

const roles = [
  { value: 'user', label: '普通用户' },
  { value: 'merchant', label: '商家' },
  { value: 'admin', label: '管理员' },
]

const roleTagType: Record<string, string> = {
  admin: 'danger',
  merchant: 'warning',
  user: '',
}

async function fetchUsers() {
  loading.value = true
  try {
    const data = await get<{ users: User[]; pagination: { total: number } }>('/users')
    users.value = data.users || []
  } finally {
    loading.value = false
  }
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
    <h2 class="section-title">用户管理</h2>

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

.banned {
  color: var(--cc-danger);
  text-decoration: line-through;
}
</style>
