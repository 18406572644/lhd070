<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { get, download } from '@/utils/api'
import { parseImages, parseParams } from '@/stores/products'
import { Download, Filter } from 'lucide-vue-next'

interface RawProduct {
  id: number | string
  name: string
  categoryName?: string
  category?: string
  stock: number
  threshold: number
  price: number
  params?: string | Record<string, string>
  images?: string | string[]
}

interface Product {
  id: number | string
  name: string
  category: string
  stock: number
  threshold: number
  price: number
}

interface RawAlertItem {
  id: number | string
  name: string
  stock: number
  threshold: number
}

interface AlertItem {
  id: number | string
  name: string
  stock: number
  threshold: number
}

const products = ref<Product[]>([])
const alertItems = ref<AlertItem[]>([])
const loading = ref(false)
const exportLoading = ref(false)
const filterVisible = ref(false)

const filters = reactive({
  lowStock: false,
  format: 'xlsx',
})

const formatOptions = [
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'csv', label: 'CSV (.csv)' },
]

async function handleExport() {
  exportLoading.value = true
  try {
    const params: Record<string, unknown> = { format: filters.format }
    if (filters.lowStock) params.lowStock = 'true'
    await download('/export/inventory', params)
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败')
  } finally {
    exportLoading.value = false
  }
}

function resetFilters() {
  filters.lowStock = false
  filters.format = 'xlsx'
}

function stockStatus(stock: number, threshold: number): string {
  if (stock === 0) return 'critical'
  if (stock <= threshold) return 'warning'
  return 'normal'
}

function statusLabel(status: string): string {
  if (status === 'critical') return '缺货'
  if (status === 'warning') return '库存不足'
  return '正常'
}

function stockTrend(stock: number, threshold: number): string {
  if (stock === 0) return '需要立即补货'
  if (stock <= threshold * 0.5) return '库存紧张，建议尽快补货'
  if (stock <= threshold) return '接近预警线'
  return '库存充足'
}

async function fetchData() {
  loading.value = true
  try {
    const [productsData, alertData] = await Promise.all([
      get<{ items: RawProduct[]; pagination: { total: number } }>('/products'),
      get<{ products: RawAlertItem[] } | RawAlertItem[]>('/stats/inventory-alert'),
    ])
    products.value = (productsData.items || []).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.categoryName || p.category || '',
      stock: p.stock,
      threshold: p.threshold || 0,
      price: p.price,
    }))
    const alertList = Array.isArray(alertData) ? alertData : (alertData as { products: RawAlertItem[] }).products || []
    alertItems.value = alertList.map((a) => ({
      id: a.id,
      name: a.name,
      stock: a.stock,
      threshold: a.threshold,
    }))
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <div class="admin-inventory animate-fade-in">
    <div class="page-header">
      <h2 class="section-title">全局库存监控</h2>
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
          <el-form-item label="仅导出低库存">
            <el-switch v-model="filters.lowStock" />
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

    <div v-if="alertItems.length > 0" class="alert-section cyber-card">
      <h3 class="sub-title">
        低库存预警
        <el-tag type="danger" size="small" effect="dark" class="alert-badge">
          {{ alertItems.length }}
        </el-tag>
      </h3>
      <div class="alert-list">
        <div v-for="item in alertItems" :key="item.id" class="alert-item">
          <div class="alert-left">
            <span class="alert-name">{{ item.name }}</span>
            <span class="alert-hint">{{ stockTrend(item.stock, item.threshold) }}</span>
          </div>
          <div class="alert-right">
            <span class="alert-stock" :class="{ critical: item.stock === 0 }">
              {{ item.stock }}
            </span>
            <span class="alert-threshold">/ {{ item.threshold }}</span>
          </div>
        </div>
      </div>
    </div>

    <el-table v-loading="loading" :data="products" stripe class="inventory-table">
      <el-table-column label="商品名称" prop="name" min-width="200" />
      <el-table-column label="分类" prop="category" width="120" />
      <el-table-column label="价格" width="110" align="right">
        <template #default="{ row }">
          <span class="cyan">¥{{ row.price.toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="当前库存" prop="stock" width="110" align="center">
        <template #default="{ row }">
          <span :class="stockStatus(row.stock, row.threshold)">{{ row.stock }}</span>
        </template>
      </el-table-column>
      <el-table-column label="预警阈值" prop="threshold" width="110" align="center" />
      <el-table-column label="状态" width="110" align="center">
        <template #default="{ row }">
          <el-tag
            size="small"
            :type="stockStatus(row.stock, row.threshold) === 'normal' ? 'success' : stockStatus(row.stock, row.threshold) === 'warning' ? 'warning' : 'danger'"
            effect="dark"
          >
            {{ statusLabel(stockStatus(row.stock, row.threshold)) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="趋势提示" min-width="180">
        <template #default="{ row }">
          <span class="trend-hint">{{ stockTrend(row.stock, row.threshold) }}</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.admin-inventory {
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

.sub-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--cc-white);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.alert-badge {
  font-size: 0.7rem;
}

.alert-section {
  margin-bottom: 1.5rem;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.alert-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0.75rem;
  background: rgba(255, 107, 107, 0.06);
  border: 1px solid rgba(255, 107, 107, 0.15);
  border-radius: 0.375rem;
}

.alert-left {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.alert-name {
  font-size: 0.9rem;
  color: var(--cc-text);
}

.alert-hint {
  font-size: 0.75rem;
  color: var(--cc-text-dim);
}

.alert-right {
  display: flex;
  align-items: baseline;
  gap: 0.2rem;
}

.alert-stock {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--cc-warning);
}

.alert-stock.critical {
  color: var(--cc-danger);
}

.alert-threshold {
  font-size: 0.85rem;
  color: var(--cc-text-dim);
}

.normal {
  color: var(--cc-success);
  font-weight: 600;
}

.warning {
  color: var(--cc-warning);
  font-weight: 600;
}

.critical {
  color: var(--cc-danger);
  font-weight: 700;
}

.trend-hint {
  font-size: 0.8rem;
  color: var(--cc-text-dim);
}
</style>
