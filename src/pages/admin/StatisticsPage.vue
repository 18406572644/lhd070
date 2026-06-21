<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { get } from '@/utils/api'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, PieChart, LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'

use([CanvasRenderer, BarChart, PieChart, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

interface MonthlySales {
  month: string
  count: number
  revenue: number
}

interface OrderStatusDist {
  status: string
  count: number
}

interface OrderOverview {
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  statusDist: OrderStatusDist[]
}

const monthlySales = ref<MonthlySales[]>([])
const overview = ref<OrderOverview>({
  totalUsers: 0,
  totalOrders: 0,
  totalRevenue: 0,
  statusDist: [],
})
const loading = ref(false)
const dateRange = ref<[string, string] | null>(null)

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
    text: '月度销售量',
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

const lineOption = computed(() => ({
  backgroundColor: 'transparent',
  title: {
    text: '月度收入趋势',
    textStyle: { color: '#F0F2F5', fontSize: 14 },
    left: 'center',
  },
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#22262E',
    borderColor: '#2E3440',
    textStyle: { color: '#C8CCD4' },
    formatter: (params: any[]) => {
      const p = params[0]
      return `${p.name}<br/>收入: ¥${p.value.toLocaleString()}`
    },
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
      type: 'line',
      data: monthlySales.value.map((s) => s.revenue),
      smooth: true,
      lineStyle: { color: '#7DFDFE', width: 2 },
      itemStyle: { color: '#7DFDFE' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(125, 253, 254, 0.3)' },
            { offset: 1, color: 'rgba(125, 253, 254, 0.02)' },
          ],
        },
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
      data: (overview.value.statusDist || []).map((s) => ({
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

async function fetchData() {
  loading.value = true
  try {
    const params: Record<string, unknown> = {}
    if (dateRange.value) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const [salesData, overviewData] = await Promise.all([
      get<{ months: string[]; orderCounts: number[]; revenues: number[] }>('/stats/monthly-sales', params),
      get<OrderOverview>('/stats/order-overview', params),
    ])
    const sd = salesData as { months: string[]; orderCounts: number[]; revenues: number[] }
    monthlySales.value = (sd.months || []).map((month, idx) => ({
      month,
      count: sd.orderCounts?.[idx] || 0,
      revenue: sd.revenues?.[idx] || 0,
    }))
    overview.value = { ...overview.value, ...overviewData }
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <div v-loading="loading" class="admin-statistics animate-fade-in">
    <div class="page-header">
      <h2 class="section-title">数据统计</h2>
      <div class="filter-row">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 300px"
        />
        <el-button type="primary" @click="fetchData">查询</el-button>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-card cyber-card">
        <VChart :option="barOption" autoresize style="height: 340px" />
      </div>
      <div class="chart-card cyber-card">
        <VChart :option="lineOption" autoresize style="height: 340px" />
      </div>
    </div>

    <div class="chart-card cyber-card pie-wrap">
      <VChart :option="pieOption" autoresize style="height: 380px" />
    </div>
  </div>
</template>

<style scoped>
.admin-statistics {
  padding: 2rem 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-header .section-title {
  margin-bottom: 0;
}

.filter-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  margin-bottom: 1.25rem;
}

.chart-card {
  padding: 1rem;
}

@media (max-width: 900px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
