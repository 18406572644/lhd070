<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { get, put, download } from '@/utils/api'
import { parseParams, parseImages } from '@/stores/products'
import { Download, Filter } from 'lucide-vue-next'

interface RawProduct {
  id: number | string
  name: string
  stock: number
  threshold: number
  price?: number
  categoryName?: string
  category?: string
  params?: string | Record<string, string>
  images?: string | string[]
}

interface Product {
  id: number | string
  name: string
  stock: number
  threshold: number
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
const restockDialog = ref(false)
const restockLoading = ref(false)
const currentProduct = ref<Product | null>(null)
const filterVisible = ref(false)

const filters = reactive({
  lowStock: false,
  format: 'xlsx',
})

const formatOptions = [
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'csv', label: 'CSV (.csv)' },
]

const restockForm = reactive({
  quantity: 1,
})

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

function statusClass(status: string): string {
  return `status-${status}`
}

function openRestock(product: Product) {
  currentProduct.value = product
  restockForm.quantity = 1
  restockDialog.value = true
}

async function submitRestock() {
  if (!currentProduct.value || restockForm.quantity <= 0) {
    ElMessage.warning('请输入补货数量')
    return
  }
  restockLoading.value = true
  try {
    const newStock = currentProduct.value.stock + restockForm.quantity
    await put(`/products/${currentProduct.value.id}`, { stock: newStock })
    ElMessage.success('补货成功')
    restockDialog.value = false
    await fetchData()
  } finally {
    restockLoading.value = false
  }
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
      stock: p.stock,
      threshold: p.threshold || 0,
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
  <div class="merchant-inventory animate-fade-in">
    <div class="page-header">
      <h2 class="section-title">库存管理</h2>
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

    <el-table v-loading="loading" :data="products" stripe>
      <el-table-column label="商品名称" prop="name" min-width="200" />
      <el-table-column label="当前库存" prop="stock" width="110" align="center">
        <template #default="{ row }">
          <span :class="statusClass(stockStatus(row.stock, row.threshold))">{{ row.stock }}</span>
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
      <el-table-column label="操作" width="100" align="center">
        <template #default="{ row }">
          <el-button size="small" type="primary" plain @click="openRestock(row)">补货</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="alertItems.length > 0" class="alert-section cyber-card">
      <h3 class="sub-title">库存预警</h3>
      <div class="alert-list">
        <div v-for="item in alertItems" :key="item.id" class="alert-item">
          <span class="alert-name">{{ item.name }}</span>
          <span class="alert-detail">
            当前 <strong>{{ item.stock }}</strong> / 阈值 {{ item.threshold }}
          </span>
        </div>
      </div>
    </div>

    <el-dialog v-model="restockDialog" title="补货" width="380px">
      <el-form label-position="top" v-if="currentProduct">
        <el-form-item :label="`为「${currentProduct.name}」补货`">
          <el-input-number v-model="restockForm.quantity" :min="1" style="width: 100%" />
        </el-form-item>
        <p class="restock-hint">
          当前库存：{{ currentProduct.stock }}，补货后：{{ currentProduct.stock + restockForm.quantity }}
        </p>
      </el-form>
      <template #footer>
        <el-button @click="restockDialog = false">取消</el-button>
        <el-button type="primary" :loading="restockLoading" @click="submitRestock">确认补货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.merchant-inventory {
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

.status-normal {
  color: var(--cc-success);
  font-weight: 600;
}

.status-warning {
  color: var(--cc-warning);
  font-weight: 600;
}

.status-critical {
  color: var(--cc-danger);
  font-weight: 700;
}

.sub-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--cc-white);
  margin-bottom: 1rem;
}

.alert-section {
  margin-top: 1.5rem;
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
  padding: 0.5rem 0.75rem;
  background: rgba(255, 217, 61, 0.06);
  border: 1px solid rgba(255, 217, 61, 0.15);
  border-radius: 0.375rem;
}

.alert-name {
  font-size: 0.85rem;
  color: var(--cc-text);
}

.alert-detail {
  font-size: 0.85rem;
  color: var(--cc-text-dim);
}

.alert-detail strong {
  color: var(--cc-warning);
}

.restock-hint {
  font-size: 0.85rem;
  color: var(--cc-text-dim);
  margin: 0.5rem 0 0;
}
</style>
