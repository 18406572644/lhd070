<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const formRef = ref<FormInstance>()
const form = reactive({
  username: '',
  password: '',
})

const rules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
  ],
})

const submitting = ref(false)

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await auth.login(form.username, form.password)
    ElMessage.success('登录成功')
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch {
    ElMessage.error('登录失败，请检查用户名和密码')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-bg-pattern"></div>
    <div class="login-container">
      <div class="login-card cyber-card">
        <div class="login-header">
          <h1 class="glitch-text login-title" data-text="CYBERCRAFT">CYBERCRAFT</h1>
          <p class="login-subtitle">欢迎回来</p>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              class="cyber-input-el"
              :prefix-icon="'User'"
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              show-password
              class="cyber-input-el"
              :prefix-icon="'Lock'"
            />
          </el-form-item>

          <el-button
            type="primary"
            class="login-btn"
            :loading="submitting || auth.loading"
            @click="handleLogin"
          >
            {{ submitting || auth.loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form>

        <div class="login-footer">
          <span class="login-footer-text">还没有账号？</span>
          <router-link to="/register" class="login-link">立即注册</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  position: relative;
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: var(--cc-dark);
}

.login-bg-pattern {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(125, 253, 254, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(125, 253, 254, 0.02) 1px, transparent 1px);
  background-size: 32px 32px;
  pointer-events: none;
}

.login-bg-pattern::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 20%, rgba(125, 253, 254, 0.15) 50%, transparent 80%);
}

.login-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
}

.login-card {
  padding: 40px 36px;
  border-top: 2px solid var(--cc-cyan);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  font-size: 2.2rem;
  letter-spacing: 6px;
  margin-bottom: 8px;
  text-shadow: 0 0 15px rgba(125, 253, 254, 0.3);
}

.login-subtitle {
  font-size: 0.95rem;
  color: var(--cc-text-dim);
  margin: 0;
}

.login-form {
  margin-bottom: 20px;
}

.login-form :deep(.el-form-item__label) {
  color: var(--cc-text);
  font-size: 0.85rem;
}

.login-form :deep(.el-input__wrapper) {
  background-color: var(--cc-card);
  border: 1px solid var(--cc-border);
  box-shadow: none;
  border-radius: 0.375rem;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.login-form :deep(.el-input__wrapper:hover) {
  border-color: var(--cc-cyan-dim);
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: var(--cc-cyan);
  box-shadow: 0 0 0 2px var(--cc-cyan-glow);
}

.login-form :deep(.el-input__inner) {
  color: var(--cc-text);
}

.login-form :deep(.el-input__inner::placeholder) {
  color: var(--cc-text-dim);
}

.login-btn {
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

.login-btn:hover {
  background-color: var(--cc-accent);
  border-color: var(--cc-accent);
  box-shadow: 0 0 20px var(--cc-cyan-glow), 0 0 40px rgba(125, 253, 254, 0.15);
}

.login-btn:active {
  transform: scale(0.98);
}

.login-footer {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid var(--cc-border);
}

.login-footer-text {
  color: var(--cc-text-dim);
  font-size: 0.85rem;
}

.login-link {
  color: var(--cc-cyan);
  font-size: 0.85rem;
  text-decoration: none;
  margin-left: 4px;
  transition: color 0.2s;
}

.login-link:hover {
  color: var(--cc-accent);
  text-shadow: 0 0 8px var(--cc-cyan-glow);
}
</style>
