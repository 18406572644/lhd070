<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductsStore, formatProduct } from '@/stores/products'
import type { Product } from '@/stores/products'
import { useCartStore } from '@/stores/cart'
import { useCompareStore } from '@/stores/compare'
import { get } from '@/utils/api'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const productsStore = useProductsStore()
const cartStore = useCartStore()
const compareStore = useCompareStore()

const product = computed(() => productsStore.currentProduct)
const quantity = ref(1)
const activeImage = ref(0)
const relatedProducts = ref<Product[]>([])
const loading = ref(true)

const parsedParams = computed(() => {
  if (!product.value?.params) return []
  const obj = product.value.params as Record<string, string>
  return Object.entries(obj).map(([key, val]) => ({ key, value: String(val) }))
})

const productImages = computed(() => {
  if (!product.value?.images) return []
  return product.value.images as string[]
})

async function fetchRelated() {
  if (!product.value) return
  try {
    const catSlug = (product.value as any).categorySlug || (product.value as any).categoryName
    const data = await get<{ items: Record<string, unknown>[] }>('/products', { category: catSlug, limit: 5 })
    const items = (data.items || []).map(formatProduct)
    relatedProducts.value = items.filter((p) => String(p.id) !== String(product.value!.id)).slice(0, 4)
  } catch {
    relatedProducts.value = []
  }
}

async function handleAddCart() {
  if (!product.value) return
  try {
    await cartStore.addItem(product.value.id, quantity.value, 'product')
    ElMessage.success('已加入购物车')
  } catch {
    //
  }
}

function goBuilder() {
  router.push('/builder')
}

function handleAddCompare() {
  if (!product.value) return
  const result = compareStore.addItem(product.value)
  if (result.ok) {
    ElMessage.success('已加入对比栏')
  } else {
    ElMessage.warning(result.msg || '无法加入对比')
  }
}

function goProduct(id: number | string) {
  router.push(`/products/${id}`)
}

onMounted(async () => {
  loading.value = true
  try {
    await productsStore.fetchProduct(route.params.id as string)
    await fetchRelated()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="detail-page">
    <div v-if="loading" class="loading-state">
      <el-icon class="is-loading" :size="32"><svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 64a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V96a32 32 0 0 1 32-32zm0 640a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V736a32 32 0 0 1 32-32zM195.2 195.2a32 32 0 0 1 45.248 0l135.808 135.808a32 32 0 0 1-45.248 45.248L195.2 240.448a32 32 0 0 1 0-45.248zm452.544 452.544a32 32 0 0 1 45.248 0l135.808 135.808a32 32 0 0 1-45.248 45.248L647.744 693.248a32 32 0 0 1 0-45.248zM64 512a32 32 0 0 1 32-32h192a32 32 0 0 1 0 64H96a32 32 0 0 1-32-32zm640 0a32 32 0 0 1 32-32h192a32 32 0 0 1 0 64H736a32 32 0 0 1-32-32zM195.2 828.8a32 32 0 0 1 0-45.248l135.808-135.808a32 32 0 0 1 45.248 45.248L240.448 828.8a32 32 0 0 1-45.248 0zm452.544-452.544a32 32 0 0 1 0-45.248l135.808-135.808a32 32 0 0 1 45.248 45.248L693.248 376.256a32 32 0 0 1-45.248 0z" fill="currentColor"/></svg></el-icon>
    </div>

    <template v-else-if="product">
      <div class="detail-top">
        <div class="gallery">
          <div class="main-image image-placeholder">
            <svg v-if="productImages.length === 0" viewBox="0 0 24 24" fill="none" stroke="var(--cc-cyan)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <line x1="6" y1="10" x2="6" y2="10.01" />
              <line x1="10" y1="10" x2="10" y2="10.01" />
              <line x1="14" y1="10" x2="14" y2="10.01" />
              <line x1="18" y1="10" x2="18" y2="10.01" />
              <line x1="8" y1="14" x2="16" y2="14" />
            </svg>
          </div>
          <div class="thumbnails">
            <div
              v-for="i in Math.max(1, productImages.length)"
              :key="i"
              class="thumb image-placeholder"
              :class="{ active: activeImage === i - 1 }"
              @click="activeImage = i - 1"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--cc-cyan)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <line x1="8" y1="14" x2="16" y2="14" />
              </svg>
            </div>
          </div>
        </div>

        <div class="info-panel">
          <h1 class="product-name">{{ product.name }}</h1>
          <span class="tag-cyan">{{ product.brand }}</span>
          <div class="product-price">¥{{ product.price }}</div>
          <div class="stock-status">
            <span class="stock-dot" :class="product.stock > 0 ? 'in-stock' : 'out-stock'"></span>
            <span>{{ product.stock > 0 ? `有货 (库存 ${product.stock})` : '缺货' }}</span>
          </div>

          <el-descriptions
            v-if="parsedParams.length > 0"
            title="产品参数"
            :column="2"
            border
            class="params-table"
          >
            <el-descriptions-item
              v-for="param in parsedParams"
              :key="param.key"
              :label="param.key"
            >
              {{ param.value }}
            </el-descriptions-item>
          </el-descriptions>

          <div class="action-row">
            <el-input-number v-model="quantity" :min="1" :max="product.stock || 99" size="large" />
            <button
              class="cyber-btn-primary"
              :disabled="product.stock <= 0"
              @click="handleAddCart"
            >
              加入购物车
            </button>
            <button class="cyber-btn" @click="goBuilder">加入组装</button>
            <button
              class="detail-compare-btn"
              :class="{ active: compareStore.isInCompare(product.id) }"
              @click="handleAddCompare"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              {{ compareStore.isInCompare(product.id) ? '已加入对比' : '加入对比' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="relatedProducts.length > 0" class="related-section">
        <h2 class="section-title">搭配推荐</h2>
        <div class="related-grid">
          <div
            v-for="item in relatedProducts"
            :key="item.id"
            class="related-card cyber-card"
            @click="goProduct(item.id)"
          >
            <div class="image-placeholder small">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--cc-cyan)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="28" height="28">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <line x1="8" y1="14" x2="16" y2="14" />
              </svg>
            </div>
            <div class="related-info">
              <div class="related-name">{{ item.name }}</div>
              <div class="related-price">¥{{ item.price }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="empty-state">
      <p>商品不存在</p>
    </div>
  </div>
</template>

<style scoped>
.detail-page {
  animation: fadeInUp 0.5s ease;
}

.detail-top {
  display: flex;
  gap: 32px;
  margin-bottom: 2.5rem;
}

.gallery {
  width: 420px;
  flex-shrink: 0;
}

.main-image {
  width: 100%;
  aspect-ratio: 4/3;
  margin-bottom: 12px;
}

.image-placeholder {
  background: linear-gradient(135deg, rgba(125, 253, 254, 0.08), rgba(125, 253, 254, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid var(--cc-border);
}

.main-image svg {
  width: 56px;
  height: 56px;
  opacity: 0.5;
}

.thumbnails {
  display: flex;
  gap: 8px;
}

.thumb {
  width: 72px;
  height: 54px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid var(--cc-border);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.thumb.active {
  border-color: var(--cc-cyan);
  box-shadow: 0 0 8px var(--cc-cyan-glow);
}

.thumb:hover {
  border-color: var(--cc-cyan-dim);
}

.info-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.product-name {
  font-size: 1.75rem;
  line-height: 1.3;
}

.product-price {
  font-family: 'Rajdhani', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: var(--cc-cyan);
}

.stock-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--cc-text);
}

.stock-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.stock-dot.in-stock {
  background: var(--cc-success);
  box-shadow: 0 0 8px var(--cc-success);
}

.stock-dot.out-stock {
  background: var(--cc-danger);
  box-shadow: 0 0 8px var(--cc-danger);
}

.params-table {
  margin-top: 8px;
}

.action-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
}

.detail-compare-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.5rem 1.25rem;
  border: 1px solid var(--cc-border);
  background: transparent;
  color: var(--cc-text-dim);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.25s ease;
}

.detail-compare-btn svg {
  width: 16px;
  height: 16px;
}

.detail-compare-btn:hover {
  border-color: var(--cc-cyan-dim);
  color: var(--cc-cyan);
}

.detail-compare-btn.active {
  border-color: var(--cc-cyan);
  color: var(--cc-cyan);
  background: rgba(125, 253, 254, 0.1);
}

.related-section {
  margin-top: 1rem;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.related-card {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.image-placeholder.small {
  width: 100%;
  aspect-ratio: 4/3;
}

.related-info {
  text-align: center;
}

.related-name {
  font-size: 0.85rem;
  color: var(--cc-white);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}

.related-price {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--cc-cyan);
}

.loading-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: var(--cc-text-dim);
}

@media (max-width: 900px) {
  .detail-top {
    flex-direction: column;
  }
  .gallery {
    width: 100%;
  }
  .related-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
