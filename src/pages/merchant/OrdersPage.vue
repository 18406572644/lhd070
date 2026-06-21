<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { get, put, post, download } from '@/utils/api'
import { Download, Filter } from 'lucide-vue-next'

interface OrderItem {
  id: number | string
  productName: string
  price: number
  quantity: number
}

interface Order {
  id: number | string
  orderNo: string
  customerName: string
  totalAmount: number
  status: string
  createdAt: string
  items: OrderItem[]
}

const orders = ref<Order[]>([])
const loading = ref(false)
const exportLoading = ref(false)
const progressDialog = ref(false)
const progressLoading = ref(false)
const currentOrderId = ref<number | string | null>(null)
const filterVisible = ref(false)

const filters = reactive({
  status: '',
  startDate: '',
  endDate: '',
  format: 'xlsx',
})

const progressForm = reactive({
  title: '',
  description: '',
})

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

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待确认' },
  { value: 'confirmed', label: '已确认' },
  { value: 'processing', label: '处理中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]

const formatOptions = [
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'csv', label: 'CSV (.csv)' },
]

async function fetchOrders() {
  loading.value = true
  try {
    const data = await get<{ orders: Order[]; total: number }>('/orders')
    orders.value = data.orders || []
  } finally {
    loading.value = false
  }
}

async function handleExport() {
  exportLoading.value = true
  try {
    const params: Record<string, unknown> = { format: filters.format }
    if (filters.status) params.status = filters.status
    if (filters.startDate) params.startDate = filters.startDate
    if (filters.endDate) params.endDate = filters.endDate
    await download('/export/orders', params)
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败')
  } finally {
    exportLoading.value = false
  }
}

function resetFilters() {
  filters.status = ''
  filters.startDate = ''
  filters.endDate = ''
  filters.format = 'xlsx'
}

async function confirmOrder(id: number | string) {
  try {
    await put(`/orders/${id}/status`, { status: 'confirmed' })
    ElMessage.success('订单已确认')
    await fetchOrders()
  } catch {
    // handled by interceptor
  }
}

async function completeOrder(id: number | string) {
  try {
    await put(`/orders/${id}/status`, { status: 'completed' })
    ElMessage.success('订单已完成')
    await fetchOrders()
  } catch {
    // handled by interceptor
  }
}

function openProgressDialog(id: number | string) {
  currentOrderId.value = id
  progressForm.title = ''
  progressForm.description = ''
  progressDialog.value = true
}

async function submitProgress() {
  if (!progressForm.title) {
    ElMessage.warning('请填写进度标题')
    return
  }
  progressLoading.value = true
  try {
    await post(`/orders/${currentOrderId.value}/progress`, {
      title: progressForm.title,
      description: progressForm.description,
    })
    ElMessage.success('进度已更新')
    progressDialog.value = false
    await fetchOrders()
  } finally {
    progressLoading.value = false
  }
}

onMounted(fetchOrders)
</script>

<template>
  <div class="merchant-orders animate-fade-in">
    <div class="page-header">
      <h2 class="section-title">订单管理</h2>
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
          <el-form-item label="订单状态">
            <el-select v-model="filters.status" placeholder="全部状态" style="width: 140px">
              <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="开始日期">
            <el-date-picker
              v-model="filters.startDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              style="width: 160px"
            />
          </el-form-item>
          <el-form-item label="结束日期">
            <el-date-picker
              v-model="filters.endDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              style="width: 160px"
            />
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

    <el-table v-loading="loading" :data="orders" stripe row-key="id">
      <el-table-column type="expand">
        <template #default="{ row }">
          <div class="expand-content">
            <el-table :data="row.items" size="small" border>
              <el-table-column label="商品" prop="productName" />
              <el-table-column label="单价" width="100" align="right">
                <template #default="{ item }">¥{{ item.price.toFixed(2) }}</template>
              </el-table-column>
              <el-table-column label="数量" prop="quantity" width="80" align="center" />
              <el-table-column label="小计" width="100" align="right">
                <template #default="{ item }">
                  <span class="cyan">¥{{ (item.price * item.quantity).toFixed(2) }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>
      </el-table-column>
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
      <el-table-column label="操作" width="260" align="center">
        <template #default="{ row }">
          <el-button
            v-if="row.status === 'pending'"
            size="small"
            type="warning"
            plain
            @click="confirmOrder(row.id)"
          >
            确认订单
          </el-button>
          <el-button
            v-if="row.status === 'confirmed' || row.status === 'processing'"
            size="small"
            type="primary"
            plain
            @click="openProgressDialog(row.id)"
          >
            更新进度
          </el-button>
          <el-button
            v-if="row.status === 'processing'"
            size="small"
            type="success"
            plain
            @click="completeOrder(row.id)"
          >
            完成订单
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="progressDialog" title="更新进度" width="460px">
      <el-form label-position="top">
        <el-form-item label="进度标题" required>
          <el-input v-model="progressForm.title" placeholder="例如：已开始组装" />
        </el-form-item>
        <el-form-item label="进度描述">
          <el-input
            v-model="progressForm.description"
            type="textarea"
            :rows="3"
            placeholder="描述当前进度详情"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="progressDialog = false">取消</el-button>
        <el-button type="primary" :loading="progressLoading" @click="submitProgress">
          提交
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.merchant-orders {
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

.cyan {
  color: var(--cc-cyan);
  font-weight: 600;
}

.amount {
  color: var(--cc-cyan);
  font-weight: 600;
}

.expand-content {
  padding: 1rem 2rem;
}
</style>
