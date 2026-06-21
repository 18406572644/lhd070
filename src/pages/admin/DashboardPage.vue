<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { get } from '@/utils/api'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'

use([CanvasRenderer, BarChart, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

interface OrderOverview {
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  lowStockCount: number
  statusDist: OrderStatusDist[]
}

interface MonthlySales {
  month: string
  count: number
}

interface OrderStatusDist {
  status: string
  count: number
}

const overview = ref<OrderOverview>({
  totalUsers: 0,
  totalOrders: 0,
  totalRevenue: 0,
  lowStockCount: 0,
  statusDist: [],
})
const monthlySales = ref<MonthlySales[]>([])
const statusDist = ref<OrderStatusDist[]>([])
const loading = ref(false)

const statCards = computed(() => [
  { label: '总用户', value: overview.value.totalUsers ?? 0, color: '#7DFDFE' },
  { label: '总订单', value: overview.value.totalOrders ?? 0, color: '#B8FFFE' },
  { label: '总收入', value: `¥${(overview.value.totalRevenue ?? 0).toLocaleString()}`, color: '#6BCB77' },
  { label: '库存预警数', value: overview.value.lowStockCount ?? 0, color: '#FF6B6B' },
])

const statusLabel: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  processing: '处理中',
  completed: '已完成',
  cancelled: '已取消',
}

const barOption = computed(() => ({
  backgroundColor: 'transparent',
  title: {
    text: '月度销售',
    textStyle: { color: '#F0F2F5', fontSize: 14 },
    left: 'center',
  },
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#22262E',
    borderColor: '#2E3440',
    textStyle: { color: '#C8CCD4' },
  },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: monthlySales.value.map((s) => s.month),
    axisLine: { lineStyle: { color: '#2E3440' } },
    axisLabel: { color: '#8892A0' },
  },
  yAxis: {
    type: 'value',
    axisLine: { lineStyle: { color: '#2E3440' } },
    axisLabel: { color: '#8892A0' },
    splitLine: { lineStyle: { color: '#2E3440' } },
  },
  series: [
    {
      type: 'bar',
      data: monthlySales.value.map((s) => s.count),
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#7DFDFE' },
            { offset: 1, color: '#5BC4C5' },
          ],
        },
        borderRadius: [4, 4, 0, 0],
      },
    },
  ],
}))

const pieOption = computed(() => ({
  backgroundColor: 'transparent',
  title: {
    text: '订单状态分布',
    textStyle: { color: '#F0F2F5', fontSize: 14 },
    left: 'center',
  },
  tooltip: {
    trigger: 'item',
    backgroundColor: '#22262E',
    borderColor: '#2E3440',
    textStyle: { color: '#C8CCD4' },
  },
  legend: {
    orient: 'vertical',
    left: 'left',
    textStyle: { color: '#8892A0' },
  },
  series: [
    {
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['55%', '55%'],
      data: (overview.value.statusDist || statusDist.value || []).map((s) => ({
        name: statusLabel[s.status] || s.status,
        value: s.count,
      })),
      label: { color: '#C8CCD4' },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(125, 253, 254, 0.5)',
        },
      },
      itemStyle: {
        borderColor: '#1A1D23',
        borderWidth: 2,
      },
    },
  ],
  color: ['#7DFDFE', '#5BC4C5', '#FFD93D', '#6BCB77', '#FF6B6B'],
}))

async function fetchDashboard() {
  loading.value = true
  try {
    const [overviewData, salesData] = await Promise.all([
      get<OrderOverview>('/stats/order-overview'),
      get<{ months: string[]; orderCounts: number[]; revenues: number[] }>('/stats/monthly-sales'),
    ])
    overview.value = { ...overview.value, ...overviewData }
    if (overviewData.statusDist) {
      statusDist.value = overviewData.statusDist
    }
    const sd = salesData as { months: string[]; orderCounts: number[]; revenues: number[] }
    monthlySales.value = (sd.months || []).map((month, idx) => ({
      month,
      count: sd.orderCounts?.[idx] || 0,
    }))
  } finally {
    loading.value = false
  }
}

onMounted(fetchDashboard)
</script>

<template>
  <div v-loading="loading" class="admin-dashboard animate-fade-in">
    <h2 class="section-title">管理后台</h2>

    <div class="stat-row">
      <div v-for="card in statCards" :key="card.label" class="stat-card cyber-card">
        <div class="stat-label">{{ card.label }}</div>
        <div class="stat-value" :style="{ color: card.color }">{{ card.value }}</div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-card cyber-card">
        <VChart :option="barOption" autoresize style="height: 340px" />
      </div>
      <div class="chart-card cyber-card">
        <VChart :option="pieOption" autoresize style="height: 340px" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-dashboard {
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

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.chart-card {
  padding: 1rem;
}

@media (max-width: 900px) {
  .stat-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
