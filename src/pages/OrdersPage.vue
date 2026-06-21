<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { get } from '@/utils/api'

interface Order {
  id: number | string
  orderNo: string
  createdAt: string
  status: string
  totalAmount: number
  itemCount: number
}

const router = useRouter()
const orders = ref<Order[]>([])
const loading = ref(false)
const activeTab = ref('all')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const tabs = [
  { label: '全部', value: 'all' },
  { label: '待确认', value: 'pending' },
  { label: '处理中', value: 'processing' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
]

const statusTagType: Record<string, string> = {
  pending: 'warning',
  confirmed: '',
  processing: '',
  completed: 'success',
  cancelled: 'danger',
}

const statusLabel: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  processing: '处理中',
  completed: '已完成',
  cancelled: '已取消',
}

async function fetchOrders() {
  loading.value = true
  try {
    const params: Record<string, unknown> = {
      page: currentPage.value,
      pageSize: pageSize.value,
    }
    if (activeTab.value !== 'all') {
      params.status = activeTab.value
    }
    const data = await get<{ orders: Order[]; total: number }>('/orders', params)
    orders.value = data.orders || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

function handleTabChange() {
  currentPage.value = 1
  fetchOrders()
}

function handlePageChange() {
  fetchOrders()
}

function goDetail(id: number | string) {
  router.push(`/orders/${id}`)
}

onMounted(fetchOrders)
</script>

<template>
  <div class="orders-page animate-fade-in">
    <h2 class="section-title">我的订单</h2>

    <el-tabs v-model="activeTab" class="cyber-tabs" @tab-change="handleTabChange">
      <el-tab-pane v-for="tab in tabs" :key="tab.value" :label="tab.label" :name="tab.value" />
    </el-tabs>

    <div v-loading="loading" class="order-list">
      <div
        v-for="order in orders"
        :key="order.id"
        class="order-card cyber-card"
        @click="goDetail(order.id)"
      >
        <div class="order-header">
          <span class="order-no">{{ order.orderNo }}</span>
          <el-tag :type="statusTagType[order.status]" size="small" effect="dark">
            {{ statusLabel[order.status] || order.status }}
          </el-tag>
        </div>
        <div class="order-body">
          <div class="order-info">
            <span class="info-label">下单时间</span>
            <span class="info-value">{{ order.createdAt }}</span>
          </div>
          <div class="order-info">
            <span class="info-label">商品数量</span>
            <span class="info-value">{{ order.itemCount }} 件</span>
          </div>
          <div class="order-info">
            <span class="info-label">订单金额</span>
            <span class="info-value amount">¥{{ order.totalAmount.toFixed(2) }}</span>
          </div>
        </div>
        <div class="order-footer">
          <el-link type="primary" :underline="false" @click.stop="goDetail(order.id)">
            查看详情 →
          </el-link>
        </div>
      </div>

      <el-empty v-if="!loading && orders.length === 0" description="暂无订单" />
    </div>

    <div v-if="total > pageSize" class="pagination-wrap">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        background
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.orders-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.order-card {
  cursor: pointer;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.order-no {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 600;
  color: var(--cc-cyan);
  font-size: 1rem;
}

.order-body {
  display: flex;
  gap: 2rem;
}

.order-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.info-label {
  font-size: 0.75rem;
  color: var(--cc-text-dim);
}

.info-value {
  font-size: 0.9rem;
  color: var(--cc-text);
}

.info-value.amount {
  color: var(--cc-cyan);
  font-weight: 700;
  font-size: 1.1rem;
}

.order-footer {
  margin-top: 0.75rem;
  text-align: right;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}
</style>
