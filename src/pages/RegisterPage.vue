<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const auth = useAuthStore()

const formRef = ref<FormInstance>()
const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'user',
})

const validateConfirm = (_rule: unknown, value: string, callback: (err?: Error) => void) => {
  if (value !== form.password) {
    callback(new Error('两次密码输入不一致'))
  } else {
    callback()
  }
}

const rules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名2-20个字符', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' },
  ],
})

const submitting = ref(false)

async function handleRegister() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await auth.register(form.username, form.email, form.password, form.role === 'merchant' ? 'merchant' : undefined)
    ElMessage.success('注册成功')
    router.push('/')
  } catch {
    ElMessage.error('注册失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="register-page">
    <div class="register-bg-pattern"></div>
    <div class="register-container">
      <div class="register-card cyber-card">
        <div class="register-header">
          <h1 class="glitch-text register-title" data-text="CYBERCRAFT">CYBERCRAFT</h1>
          <p class="register-subtitle">加入赛博工坊</p>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          class="register-form"
          @submit.prevent="handleRegister"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
            />
          </el-form-item>

          <el-form-item label="邮箱" prop="email">
            <el-input
              v-model="form.email"
              placeholder="请输入邮箱"
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              show-password
            />
          </el-form-item>

          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              show-password
            />
          </el-form-item>

          <el-form-item label="角色" prop="role">
            <el-radio-group v-model="form.role" class="role-radio-group">
              <el-radio value="user" class="role-radio">普通用户</el-radio>
              <el-radio value="merchant" class="role-radio">商家</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-button
            type="primary"
            class="register-btn"
            :loading="submitting || auth.loading"
            @click="handleRegister"
          >
            {{ submitting || auth.loading ? '注册中...' : '注册' }}
          </el-button>
        </el-form>

        <div class="register-footer">
          <span class="register-footer-text">已有账号？</span>
          <router-link to="/login" class="register-link">立即登录</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  position: relative;
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: var(--cc-dark);
}

.register-bg-pattern {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(125, 253, 254, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(125, 253, 254, 0.02) 1px, transparent 1px);
  background-size: 32px 32px;
  pointer-events: none;
}

.register-bg-pattern::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 20%, rgba(125, 253, 254, 0.15) 50%, transparent 80%);
}

.register-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
}

.register-card {
  padding: 40px 36px;
  border-top: 2px solid var(--cc-cyan);
}

.register-header {
  text-align: center;
  margin-bottom: 28px;
}

.register-title {
  font-size: 2.2rem;
  letter-spacing: 6px;
  margin-bottom: 8px;
  text-shadow: 0 0 15px rgba(125, 253, 254, 0.3);
}

.register-subtitle {
  font-size: 0.95rem;
  color: var(--cc-text-dim);
  margin: 0;
}

.register-form {
  margin-bottom: 20px;
}

.register-form :deep(.el-form-item__label) {
  color: var(--cc-text);
  font-size: 0.85rem;
}

.register-form :deep(.el-input__wrapper) {
  background-color: var(--cc-card);
  border: 1px solid var(--cc-border);
  box-shadow: none;
  border-radius: 0.375rem;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.register-form :deep(.el-input__wrapper:hover) {
  border-color: var(--cc-cyan-dim);
}

.register-form :deep(.el-input__wrapper.is-focus) {
  border-color: var(--cc-cyan);
  box-shadow: 0 0 0 2px var(--cc-cyan-glow);
}

.register-form :deep(.el-input__inner) {
  color: var(--cc-text);
}

.register-form :deep(.el-input__inner::placeholder) {
  color: var(--cc-text-dim);
}

.role-radio-group {
  display: flex;
  gap: 24px;
}

.role-radio :deep(.el-radio__inner) {
  background-color: var(--cc-card);
  border-color: var(--cc-border);
}

.role-radio :deep(.el-radio__input.is-checked .el-radio__inner) {
  background-color: var(--cc-cyan);
  border-color: var(--cc-cyan);
}

.role-radio :deep(.el-radio__input.is-checked + .el-radio__label) {
  color: var(--cc-cyan);
}

.role-radio :deep(.el-radio__label) {
  color: var(--cc-text);
}

.register-btn {
  width: 100%;
  height: 44px;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 2px;
  background-color: var(--cc-cyan);
  border-color: var(--cc-cyan);
  color: var(--cc-dark);
  border-radius: 0.375rem;
  transition: all 0.3s ease;
}

.register-btn:hover {
  background-color: var(--cc-accent);
  border-color: var(--cc-accent);
  box-shadow: 0 0 20px var(--cc-cyan-glow), 0 0 40px rgba(125, 253, 254, 0.15);
}

.register-btn:active {
  transform: scale(0.98);
}

.register-footer {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid var(--cc-border);
}

.register-footer-text {
  color: var(--cc-text-dim);
  font-size: 0.85rem;
}

.register-link {
  color: var(--cc-cyan);
  font-size: 0.85rem;
  text-decoration: none;
  margin-left: 4px;
  transition: color 0.2s;
}

.register-link:hover {
  color: var(--cc-accent);
  text-shadow: 0 0 8px var(--cc-cyan-glow);
}
</style>
