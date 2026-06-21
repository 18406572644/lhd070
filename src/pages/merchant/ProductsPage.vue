<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { get, post, put, del } from '@/utils/api'
import { parseImages, parseParams } from '@/stores/products'

interface Category {
  id: number | string
  name: string
}

interface RawProduct {
  id: number | string
  name: string
  categoryId: number | string
  categoryName?: string
  category?: string
  brand: string
  price: number
  stock: number
  threshold?: number
  params: string | Record<string, string>
  images: string | string[]
}

interface Product {
  id: number | string
  name: string
  categoryId: number | string
  category: string
  brand: string
  price: number
  stock: number
  threshold?: number
  params: Record<string, string>
  images: string[]
}

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('添加商品')
const editingId = ref<number | string | null>(null)
const formLoading = ref(false)

const form = reactive({
  name: '',
  categoryId: '' as number | string,
  brand: '',
  price: 0,
  stock: 0,
  params: [] as { key: string; value: string }[],
  images: [] as string[],
})

function resetForm() {
  form.name = ''
  form.categoryId = ''
  form.brand = ''
  form.price = 0
  form.stock = 0
  form.params = []
  form.images = []
  editingId.value = null
}

function openAdd() {
  resetForm()
  dialogTitle.value = '添加商品'
  dialogVisible.value = true
}

function openEdit(product: Product) {
  resetForm()
  editingId.value = product.id
  dialogTitle.value = '编辑商品'
  form.name = product.name
  form.categoryId = product.categoryId
  form.brand = product.brand
  form.price = product.price
  form.stock = product.stock
  form.params = Object.entries(product.params || {}).map(([key, value]) => ({ key, value }))
  form.images = [...(product.images || [])]
  dialogVisible.value = true
}

function addParam() {
  form.params.push({ key: '', value: '' })
}

function removeParam(index: number) {
  form.params.splice(index, 1)
}

async function handleSubmit() {
  if (!form.name || !form.categoryId) {
    ElMessage.warning('请填写必填项')
    return
  }
  formLoading.value = true
  try {
    const paramsObj: Record<string, string> = {}
    form.params.forEach((p) => {
      if (p.key) paramsObj[p.key] = p.value
    })
    const payload = {
      name: form.name,
      categoryId: form.categoryId,
      brand: form.brand,
      price: form.price,
      stock: form.stock,
      params: paramsObj,
      images: form.images,
    }
    if (editingId.value) {
      await put(`/products/${editingId.value}`, payload)
      ElMessage.success('商品已更新')
    } else {
      await post('/products', payload)
      ElMessage.success('商品已添加')
    }
    dialogVisible.value = false
    await fetchProducts()
  } finally {
    formLoading.value = false
  }
}

async function handleDelete(product: Product) {
  try {
    await ElMessageBox.confirm(`确定删除商品「${product.name}」？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await del(`/products/${product.id}`)
    ElMessage.success('已删除')
    await fetchProducts()
  } catch {
    // cancelled
  }
}

function formatProduct(raw: RawProduct): Product {
  return {
    id: raw.id,
    name: raw.name,
    categoryId: raw.categoryId,
    category: raw.categoryName || raw.category || '',
    brand: raw.brand,
    price: raw.price,
    stock: raw.stock,
    threshold: raw.threshold,
    params: parseParams(raw.params),
    images: parseImages(raw.images),
  }
}

async function fetchProducts() {
  loading.value = true
  try {
    const data = await get<{ items: RawProduct[]; pagination: { total: number } }>('/products')
    products.value = (data.items || []).map(formatProduct)
  } finally {
    loading.value = false
  }
}

async function fetchCategories() {
  try {
    const data = await get<Category[]>('/categories')
    categories.value = data || []
  } catch {
    // ignore
  }
}

onMounted(() => {
  fetchProducts()
  fetchCategories()
})
</script>

<template>
  <div class="merchant-products animate-fade-in">
    <div class="page-header">
      <h2 class="section-title">商品管理</h2>
      <el-button type="primary" @click="openAdd">添加商品</el-button>
    </div>

    <el-table v-loading="loading" :data="products" stripe>
      <el-table-column label="商品名称" prop="name" min-width="180" />
      <el-table-column label="分类" prop="category" width="120" />
      <el-table-column label="价格" width="110" align="right">
        <template #default="{ row }">
          <span class="cyan">¥{{ row.price.toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="库存" prop="stock" width="80" align="center" />
      <el-table-column label="操作" width="160" align="center">
        <template #default="{ row }">
          <el-button size="small" link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px" class="cyber-dialog">
      <el-form label-position="top">
        <el-form-item label="商品名称" required>
          <el-input v-model="form.name" placeholder="输入商品名称" />
        </el-form-item>
        <el-form-item label="分类" required>
          <el-select v-model="form.categoryId" placeholder="选择分类" style="width: 100%">
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <div class="form-row">
          <el-form-item label="品牌" class="flex-1">
            <el-input v-model="form.brand" placeholder="品牌" />
          </el-form-item>
          <el-form-item label="价格" class="flex-1">
            <el-input-number v-model="form.price" :min="0" :precision="2" style="width: 100%" />
          </el-form-item>
          <el-form-item label="库存" class="flex-1">
            <el-input-number v-model="form.stock" :min="0" style="width: 100%" />
          </el-form-item>
        </div>
        <el-form-item label="参数">
          <div class="params-list">
            <div v-for="(p, idx) in form.params" :key="idx" class="param-row">
              <el-input v-model="p.key" placeholder="参数名" class="param-input" />
              <el-input v-model="p.value" placeholder="参数值" class="param-input" />
              <el-button size="small" type="danger" circle @click="removeParam(idx)">×</el-button>
            </div>
            <el-button size="small" @click="addParam">+ 添加参数</el-button>
          </div>
        </el-form-item>
        <el-form-item label="图片">
          <el-input
            v-model="form.images[0]"
            placeholder="输入图片URL"
            @change="(val: string) => { if (val && form.images.length === 0) form.images.push(val) }"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.merchant-products {
  padding: 2rem 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-header .section-title {
  margin-bottom: 0;
}

.cyan {
  color: var(--cc-cyan);
  font-weight: 600;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.flex-1 {
  flex: 1;
}

.params-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.param-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.param-input {
  flex: 1;
}
</style>
