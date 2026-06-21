<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Send, Image as ImageIcon } from 'lucide-vue-next'
import { get, post } from '@/utils/api'
import api from '@/utils/api'
import { useAuthStore } from '@/stores/auth'

interface ChatMessage {
  id: number
  orderId: number
  senderId: number
  senderName: string
  senderRole: string
  senderAvatar: string
  type: 'text' | 'image'
  content: string
  readBy: number[]
  createdAt: string
}

const props = defineProps<{
  orderId: number | string
}>()

const authStore = useAuthStore()
const messagesRef = ref<HTMLElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const loading = ref(false)
const sending = ref(false)
const uploading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const wsConnected = ref(false)

let ws: WebSocket | null = null
let heartbeatTimer: ReturnType<typeof setInterval> | null = null

function getWsUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.hostname
  const port = 6070
  const token = localStorage.getItem('cybercraft_token') || ''
  return `${protocol}//${host}:${port}/ws?token=${encodeURIComponent(token)}&orderId=${props.orderId}`
}

function scrollToBottom(smooth = true): void {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTo({
        top: messagesRef.value.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      })
    }
  })
}

function isMine(msg: ChatMessage): boolean {
  return msg.senderId === authStore.user?.id
}

function getSenderLabel(msg: ChatMessage): string {
  if (msg.senderRole === 'merchant') return '商家'
  if (msg.senderRole === 'admin') return '管理员'
  return msg.senderName
}

function formatTime(ts: string): string {
  const d = new Date(ts)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

async function fetchMessages(before?: number): Promise<void> {
  try {
    const params: Record<string, unknown> = { limit: 50 }
    if (before) params.before = before
    const data = await get<{ messages: ChatMessage[] }>(`/orders/${props.orderId}/messages`, params)
    if (before) {
      messages.value = [...data.messages, ...messages.value]
      if (data.messages.length < 50) hasMore.value = false
    } else {
      messages.value = data.messages
      hasMore.value = data.messages.length >= 50
      scrollToBottom(false)
    }
  } catch {
  }
}

async function loadMore(): Promise<void> {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  try {
    const firstId = messages.value[0]?.id
    if (firstId) {
      await fetchMessages(firstId)
    }
  } finally {
    loadingMore.value = false
  }
}

async function markAsRead(): Promise<void> {
  try {
    await post(`/orders/${props.orderId}/messages/read`, {})
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'mark_read', payload: { orderId: props.orderId } }))
    }
  } catch {
  }
}

function connectWS(): void {
  try {
    ws = new WebSocket(getWsUrl())

    ws.onopen = () => {
      wsConnected.value = true
      if (heartbeatTimer) clearInterval(heartbeatTimer)
      heartbeatTimer = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }))
        }
      }, 30000)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'new_message' && data.message) {
          const exists = messages.value.some((m) => m.id === data.message.id)
          if (!exists) {
            messages.value.push(data.message)
            scrollToBottom()
          }
        } else if (data.type === 'message_sent' && data.message) {
          const exists = messages.value.some((m) => m.id === data.message.id)
          if (!exists) {
            messages.value.push(data.message)
            scrollToBottom()
          }
        } else if (data.type === 'error') {
          ElMessage.error(data.error || '连接错误')
        }
      } catch {
      }
    }

    ws.onclose = () => {
      wsConnected.value = false
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer)
        heartbeatTimer = null
      }
      setTimeout(() => {
        if (ws?.readyState !== WebSocket.OPEN && ws?.readyState !== WebSocket.CONNECTING) {
          connectWS()
        }
      }, 3000)
    }

    ws.onerror = () => {
      wsConnected.value = false
    }
  } catch {
    wsConnected.value = false
  }
}

function sendTextMessage(): void {
  const text = inputText.value.trim()
  if (!text || sending.value) return

  sending.value = true
  try {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'send_message',
          payload: { orderId: props.orderId, type: 'text', content: text },
        }),
      )
      inputText.value = ''
    } else {
      post<{ message: ChatMessage }>(`/orders/${props.orderId}/messages`, { type: 'text', content: text })
        .then((data) => {
          const exists = messages.value.some((m) => m.id === data.message.id)
          if (!exists) {
            messages.value.push(data.message)
          }
          scrollToBottom()
        })
        .finally(() => {
          sending.value = false
        })
      inputText.value = ''
      return
    }
  } catch {
  } finally {
    if (ws && ws.readyState === WebSocket.OPEN) {
      sending.value = false
    }
  }
}

function triggerImageUpload(): void {
  fileInputRef.value?.click()
}

async function handleImageUpload(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  uploading.value = true
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const formData = new FormData()
      formData.append('file', file)
      try {
        const res = await api.post('/upload', formData)
        if (res.data?.success && res.data?.data?.url) {
          const url = res.data.data.url as string
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'send_message',
                payload: { orderId: props.orderId, type: 'image', content: url },
              }),
            )
          } else {
            const data = await post<{ message: ChatMessage }>(`/orders/${props.orderId}/messages`, {
              type: 'image',
              content: url,
            })
            const exists = messages.value.some((m) => m.id === data.message.id)
            if (!exists) {
              messages.value.push(data.message)
            }
            scrollToBottom()
          }
        } else {
          ElMessage.error(res.data?.error || '上传失败')
        }
      } catch (err) {
        const msg = (err as any).response?.data?.error || (err as any).message || '上传失败'
        ElMessage.error(msg)
      }
    }
  } finally {
    uploading.value = false
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}

function handleScroll(): void {
  if (!messagesRef.value) return
  if (messagesRef.value.scrollTop === 0 && hasMore.value && !loadingMore.value) {
    loadMore()
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await fetchMessages()
    await markAsRead()
    connectWS()
  } finally {
    loading.value = false
  }
})

watch(
  () => props.orderId,
  async () => {
    messages.value = []
    hasMore.value = true
    loading.value = true
    if (ws) {
      ws.close()
      ws = null
    }
    try {
      await fetchMessages()
      await markAsRead()
      connectWS()
    } finally {
      loading.value = false
    }
  },
)

onUnmounted(() => {
  if (ws) {
    ws.close()
    ws = null
  }
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
})
</script>

<template>
  <div class="chat-panel cyber-card">
    <div class="chat-header">
      <h3 class="sub-title">订单沟通</h3>
      <div class="ws-status" :class="{ connected: wsConnected }">
        <span class="dot"></span>
        {{ wsConnected ? '已连接' : '重连中...' }}
      </div>
    </div>

    <div
      ref="messagesRef"
      class="chat-messages"
      v-loading="loading"
      @scroll="handleScroll"
    >
      <div v-if="loadingMore" class="loading-more">加载中...</div>

      <div
        v-for="msg in messages"
        :key="msg.id"
        class="msg-item"
        :class="{ mine: isMine(msg) }"
      >
        <div class="msg-avatar">
          <div class="avatar-placeholder">
            {{ getSenderLabel(msg).charAt(0).toUpperCase() }}
          </div>
        </div>
        <div class="msg-body">
          <div class="msg-meta">
            <span class="msg-name" :class="{ 'is-merchant': msg.senderRole !== 'user' }">
              {{ getSenderLabel(msg) }}
            </span>
            <span class="msg-time">{{ formatTime(msg.createdAt) }}</span>
          </div>
          <div class="msg-content" :class="msg.type">
            <template v-if="msg.type === 'text'">
              <div class="msg-text">{{ msg.content }}</div>
            </template>
            <template v-else>
              <el-image
                :src="msg.content"
                fit="cover"
                class="msg-image"
                :preview-src-list="[msg.content]"
                :initial-index="0"
              />
            </template>
          </div>
        </div>
      </div>

      <div v-if="!loading && messages.length === 0" class="chat-empty">
        暂无消息，开始沟通吧
      </div>
    </div>

    <div class="chat-input-area">
      <div class="input-actions">
        <button
          type="button"
          class="action-btn"
          :disabled="uploading"
          @click="triggerImageUpload"
          title="发送图片"
        >
          <ImageIcon :size="18" />
        </button>
      </div>
      <div class="input-wrap">
        <input
          v-model="inputText"
          type="text"
          class="chat-input"
          placeholder="输入消息..."
          @keydown.enter="sendTextMessage"
        />
        <button
          type="button"
          class="send-btn"
          :disabled="!inputText.trim() || sending"
          @click="sendTextMessage"
        >
          <Send :size="16" />
        </button>
      </div>
      <input
        ref="fileInputRef"
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        hidden
        @change="handleImageUpload"
      />
    </div>
  </div>
</template>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 560px;
  max-height: 70vh;
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--cc-border);
  flex-shrink: 0;
}

.sub-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--cc-white);
  margin: 0;
}

.ws-status {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: var(--cc-text-dim);
}

.ws-status .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--cc-text-dim);
}

.ws-status.connected .dot {
  background-color: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.loading-more {
  text-align: center;
  color: var(--cc-text-dim);
  font-size: 0.8rem;
  padding: 0.5rem;
}

.chat-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--cc-text-dim);
  font-size: 0.9rem;
}

.msg-item {
  display: flex;
  gap: 0.6rem;
  max-width: 80%;
}

.msg-item.mine {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.msg-avatar {
  flex-shrink: 0;
}

.avatar-placeholder {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--cc-cyan-dim), var(--cc-cyan));
  color: var(--cc-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
}

.msg-item.mine .avatar-placeholder {
  background: linear-gradient(135deg, #a78bfa, #7c3aed);
  color: white;
}

.msg-body {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.msg-item.mine .msg-body {
  align-items: flex-end;
}

.msg-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.72rem;
  color: var(--cc-text-dim);
}

.msg-name {
  font-weight: 600;
}

.msg-name.is-merchant {
  color: var(--cc-cyan);
}

.msg-time {
  color: var(--cc-text-dim);
  opacity: 0.7;
}

.msg-content {
  padding: 0.6rem 0.85rem;
  border-radius: 0.75rem;
  background-color: var(--cc-card);
  border: 1px solid var(--cc-border);
  word-break: break-word;
  max-width: 100%;
}

.msg-item.mine .msg-content {
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.15), rgba(34, 211, 238, 0.08));
  border-color: var(--cc-cyan-dim);
}

.msg-content.text .msg-text {
  font-size: 0.9rem;
  color: var(--cc-text);
  line-height: 1.5;
  white-space: pre-wrap;
}

.msg-content.image {
  padding: 0.25rem;
}

.msg-image {
  max-width: 220px;
  max-height: 220px;
  border-radius: 0.5rem;
  display: block;
  cursor: pointer;
}

.chat-input-area {
  border-top: 1px solid var(--cc-border);
  padding: 0.75rem 1rem;
  flex-shrink: 0;
  background-color: var(--cc-bg-elevated);
}

.input-actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.action-btn {
  width: 34px;
  height: 34px;
  border-radius: 0.5rem;
  border: 1px solid var(--cc-border);
  background-color: var(--cc-card);
  color: var(--cc-text-dim);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover:not(:disabled) {
  border-color: var(--cc-cyan-dim);
  color: var(--cc-cyan);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-wrap {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.chat-input {
  flex: 1;
  padding: 0.55rem 0.85rem;
  border: 1px solid var(--cc-border);
  border-radius: 0.5rem;
  background-color: var(--cc-card);
  color: var(--cc-text);
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.chat-input::placeholder {
  color: var(--cc-text-dim);
}

.chat-input:focus {
  border-color: var(--cc-cyan-dim);
}

.send-btn {
  width: 38px;
  height: 38px;
  border-radius: 0.5rem;
  border: none;
  background: linear-gradient(135deg, var(--cc-cyan), var(--cc-cyan-dim));
  color: var(--cc-dark);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(34, 211, 238, 0.3);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
