<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { get } from '@/utils/api'

interface OrderOverview {
  todayOrders: number
  pendingOrders: number
  totalRevenue: number
}

interface InventoryAlert {
  lowStockCount: number
  items: AlertItem[]
}

interface AlertItem {
  id: number | string
  name: string
  stock: number
  threshold: number
}

interface RecentOrder {
  id: number | string
  orderNo: string
  customerName: string
  totalAmount: number
  status: string
  createdAt: string
}

const overview = ref<OrderOverview>({ todayOrders: 0, pendingOrders: 0, totalRevenue: 0 })
const alerts = ref<InventoryAlert>({ lowStockCount: 0, items: [] })
const recentOrders = ref<RecentOrder[]>([])
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

async function fetchDashboard() {
  loading.value = true
  try {
    const [overviewData, alertData, ordersData] = await Promise.all([
      get<OrderOverview>('/stats/order-overview'),
      get<{ lowStockCount: number; items: AlertItem[] }>('/stats/inventory-alert'),
      get<{ orders: RecentOrder[]; total: number }>('/orders', { pageSize: 10 }),
    ])
    overview.value = overviewData
    alerts.value = {
      lowStockCount: alertData.lowStockCount || 0,
      items: alertData.items || [],
    }
    recentOrders.value = (ordersData.orders || []).slice(0, 10)
  } finally {
    loading.value = false
  }
}

const statCards = ref([
  { key: 'todayOrders', label: '今日订单', icon: 'Document', color: '#7DFDFE' },
  { key: 'pendingOrders', label: '待处理', icon: 'Clock', color: '#FFD93D' },
  { key: 'totalRevenue', label: '总收入', icon: 'Money', color: '#6BCB77' },
  { key: 'lowStock', label: '库存预警', icon: 'Warning', color: '#FF6B6B' },
])

function getStatValue(key: string): number {
  if (key === 'lowStock') return alerts.value.lowStockCount
  return (overview.value as Record<string, number>)[key] ?? 0
}

onMounted(fetchDashboard)
</script>

<template>
  <div v-loading="loading" class="merchant-dashboard animate-fade-in">
    <h2 class="section-title">商家中心</h2>

    <div class="stat-row">
      <div v-for="card in statCards" :key="card.key" class="stat-card cyber-card">
        <div class="stat-label">{{ card.label }}</div>
        <div class="stat-value" :style="{ color: card.color }">
          {{ card.key === 'totalRevenue' ? '¥' : '' }}{{ getStatValue(card.key) }}
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="recent-orders cyber-card">
        <h3 class="sub-title">最近订单</h3>
        <el-table :data="recentOrders" stripe size="small">
          <el-table-column label="订单号" prop="orderNo" width="160">
            <template #default="{ row }">
              <span class="cyan">{{ row.orderNo }}</span>
            </template>
          </el-table-column>
          <el-table-column label="客户" prop="customerName" width="120" />
          <el-table-column label="金额" width="110" align="right">
            <template #default="{ row }">
              <span class="amount">¥{{ row.totalAmount.toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="statusTagType[row.status]" effect="dark">
                {{ statusLabel[row.status] || row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="时间" prop="createdAt" width="170" />
        </el-table>
      </div>

      <div class="low-stock cyber-card">
        <h3 class="sub-title">库存预警</h3>
        <div v-if="alerts.items.length === 0" class="all-ok">库存状态良好</div>
        <div v-else class="alert-list">
          <div v-for="item in alerts.items" :key="item.id" class="alert-item">
            <span class="alert-name">{{ item.name }}</span>
            <span class="alert-stock">
              <span class="stock-num" :class="{ critical: item.stock === 0 }">
                {{ item.stock }}
              </span>
              / {{ item.threshold }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.merchant-dashboard {
  padding: 2rem 1.5rem;
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  text-align: center;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--cc-text-dim);
  margin-bottom: 0.5rem;
}

.stat-value {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1.25rem;
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

.all-ok {
  color: var(--cc-success);
  font-size: 0.9rem;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.alert-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 107, 107, 0.08);
  border: 1px solid rgba(255, 107, 107, 0.2);
  border-radius: 0.375rem;
}

.alert-name {
  font-size: 0.85rem;
  color: var(--cc-text);
}

.alert-stock {
  font-size: 0.85rem;
  color: var(--cc-text-dim);
}

.stock-num {
  color: var(--cc-warning);
  font-weight: 600;
}

.stock-num.critical {
  color: var(--cc-danger);
}

@media (max-width: 900px) {
  .stat-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
