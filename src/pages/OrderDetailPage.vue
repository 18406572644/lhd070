<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { get } from '@/utils/api'

import { parseImages } from '@/stores/products'
import OrderChatPanel from '@/components/OrderChatPanel.vue'

interface OrderItem {
  id: number | string
  productId: number | string
  productName: string
  productImages?: string | string[]
  price: number
  quantity: number
  image?: string
  images?: string[]
}

interface ProgressStep {
  id: number | string
  title: string
  description: string
  createdAt: string
}

interface Order {
  id: number | string
  orderNo: string
  status: string
  createdAt: string
  totalAmount: number
  shippingName: string
  shippingPhone: string
  shippingAddress: string
  photos?: string | string[]
}

interface OrderDetail extends Order {
  items: OrderItem[]
  progress: ProgressStep[]
  photos: string[]
}

const route = useRoute()
const order = ref<OrderDetail | null>(null)
const loading = ref(false)

const statusLabel: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  processing: '处理中',
  completed: '已完成',
  cancelled: '已取消',
}

const statusTagType: Record<string, string> = {
  pending: 'warning',
  confirmed: '',
  processing: '',
  completed: 'success',
  cancelled: 'danger',
}

const timelineSteps = [
  { key: 'pending', label: '待确认' },
  { key: 'confirmed', label: '已确认' },
  { key: 'processing', label: '处理中' },
  { key: 'completed', label: '已完成' },
]

function getStepIndex(status: string): number {
  return timelineSteps.findIndex((s) => s.key === status)
}

function formatOrderItem(item: OrderItem): OrderItem {
  return {
    ...item,
    images: parseImages(item.productImages || item.image),
  }
}

function formatOrderDetail(raw: { order: Order; items: OrderItem[]; progress: ProgressStep[] }): OrderDetail {
  return {
    ...raw.order,
    items: (raw.items || []).map(formatOrderItem),
    progress: raw.progress || [],
    photos: parseImages(raw.order.photos),
  }
}

async function fetchOrder() {
  loading.value = true
  try {
    const id = route.params.id
    const data = await get<{ order: Order; items: OrderItem[]; progress: ProgressStep[] }>(`/orders/${id}`)
    order.value = formatOrderDetail(data)
  } finally {
    loading.value = false
  }
}

onMounted(fetchOrder)
</script>

<template>
  <div v-if="order" v-loading="loading" class="order-detail animate-fade-in">
    <h2 class="section-title">订单详情</h2>

    <div class="info-card cyber-card">
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">订单号</span>
          <span class="info-value cyan">{{ order.orderNo }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">订单状态</span>
          <el-tag :type="statusTagType[order.status]" effect="dark" size="small">
            {{ statusLabel[order.status] || order.status }}
          </el-tag>
        </div>
        <div class="info-item">
          <span class="info-label">下单时间</span>
          <span class="info-value">{{ order.createdAt }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">订单金额</span>
          <span class="info-value amount">¥{{ order.totalAmount.toFixed(2) }}</span>
        </div>
      </div>
      <el-divider />
      <div class="shipping-info">
        <h4>收货信息</h4>
        <p>{{ order.shippingName }} {{ order.shippingPhone }}</p>
        <p>{{ order.shippingAddress }}</p>
      </div>
    </div>

    <div class="timeline-section cyber-card">
      <h3 class="sub-title">订单进度</h3>
      <el-timeline>
        <el-timeline-item
          v-for="(step, idx) in timelineSteps"
          :key="step.key"
          :type="idx <= getStepIndex(order.status) ? 'primary' : 'info'"
          :hollow="idx > getStepIndex(order.status)"
          :timestamp="step.label"
          placement="top"
        >
          <span :class="['step-text', { active: idx <= getStepIndex(order.status) }]">
            {{ step.label }}
          </span>
        </el-timeline-item>
      </el-timeline>
    </div>

    <div class="items-section cyber-card">
      <h3 class="sub-title">订单商品</h3>
      <el-table
        v-if="order.items && order.items.length"
        :data="order.items"
        stripe
      >
        <el-table-column label="商品名称" prop="productName" />
        <el-table-column label="单价" width="120" align="right">
          <template #default="{ row }">
            <span class="cyan">¥{{ (Number(row.price) || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="数量" prop="quantity" width="80" align="center" />
        <el-table-column label="小计" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">
              ¥{{ ((Number(row.price) || 0) * (Number(row.quantity) || 0)).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无商品信息" :image-size="80" />
    </div>

    <div v-if="order.progress && order.progress.length" class="progress-section cyber-card">
      <h3 class="sub-title">进度记录</h3>
      <el-timeline>
        <el-timeline-item
          v-for="step in order.progress"
          :key="step.id"
          type="primary"
          :timestamp="step.createdAt"
        >
          <div class="progress-title">{{ step.title }}</div>
          <div class="progress-desc">{{ step.description }}</div>
        </el-timeline-item>
      </el-timeline>
    </div>

    <div v-if="order.photos && order.photos.length" class="photos-section cyber-card">
      <h3 class="sub-title">产品照片</h3>
      <div class="photo-grid">
        <el-image
          v-for="(photo, idx) in order.photos"
          :key="idx"
          :src="photo"
          fit="cover"
          class="photo-item"
          :preview-src-list="order.photos"
          :initial-index="idx"
        />
      </div>
    </div>

    <OrderChatPanel :order-id="order.id" />
  </div>
</template>

<style scoped>
.order-detail {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.75rem;
  color: var(--cc-text-dim);
}

.info-value {
  font-size: 0.95rem;
  color: var(--cc-text);
}

.info-value.cyan {
  color: var(--cc-cyan);
  font-family: 'Rajdhani', sans-serif;
  font-weight: 600;
}

.info-value.amount {
  color: var(--cc-cyan);
  font-weight: 700;
  font-size: 1.15rem;
}

.shipping-info h4 {
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  color: var(--cc-white);
}

.shipping-info p {
  margin: 0.2rem 0;
  font-size: 0.85rem;
  color: var(--cc-text);
}

.sub-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--cc-white);
  margin-bottom: 1rem;
}

.step-text {
  color: var(--cc-text-dim);
  font-size: 0.9rem;
}

.step-text.active {
  color: var(--cc-cyan);
  font-weight: 600;
}

.cyan {
  color: var(--cc-cyan);
}

.amount {
  color: var(--cc-cyan);
  font-weight: 600;
}

.progress-title {
  font-weight: 600;
  color: var(--cc-white);
}

.progress-desc {
  font-size: 0.85rem;
  color: var(--cc-text-dim);
  margin-top: 0.2rem;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.75rem;
}

.photo-item {
  width: 100%;
  height: 160px;
  border-radius: 0.375rem;
  border: 1px solid var(--cc-border);
}
</style>
