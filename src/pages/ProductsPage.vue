<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProductsStore } from '@/stores/products'
import { useCartStore } from '@/stores/cart'
import { useCompareStore } from '@/stores/compare'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const productsStore = useProductsStore()
const cartStore = useCartStore()
const compareStore = useCompareStore()

const categoryTabs = [
  { label: '全部', value: '' },
  { label: '轴体', value: 'switch' },
  { label: '键帽', value: 'keycap' },
  { label: '外壳', value: 'case' },
  { label: '线材', value: 'cable' },
]

const activeCategory = ref('')
const selectedBrands = ref<string[]>([])
const priceRange = ref([0, 1000])
const sortValue = ref('newest')
const searchKeyword = ref('')

const brands = ref<string[]>([])

const sortOptions = [
  { label: '最新', value: 'newest' },
  { label: '价格低→高', value: 'price-asc' },
  { label: '价格高→低', value: 'price-desc' },
  { label: '名称', value: 'name' },
]

const totalPages = computed(() =>
  Math.ceil(productsStore.total / productsStore.filters.limit),
)

const isSearchMode = computed(() => !!searchKeyword.value)

function applyFilters() {
  productsStore.setFilters({
    category: activeCategory.value,
    brand: selectedBrands.value.join(','),
    minPrice: priceRange.value[0],
    maxPrice: priceRange.value[1],
    sort: sortValue.value,
    search: searchKeyword.value,
  })
}

function handleCategoryChange(val: string) {
  activeCategory.value = val
  selectedBrands.value = []
  applyFilters()
  fetchBrands()
}

function handleBrandChange() {
  applyFilters()
}

function handlePriceChange() {
  applyFilters()
}

function handleSortChange() {
  applyFilters()
}

function handleReset() {
  activeCategory.value = ''
  selectedBrands.value = []
  priceRange.value = [0, 1000]
  sortValue.value = 'newest'
  searchKeyword.value = ''
  router.replace({ query: {} })
  productsStore.resetFilters()
  fetchBrands()
}

function clearSearch() {
  searchKeyword.value = ''
  router.replace({ query: {} })
  applyFilters()
}

function handlePageChange(page: number) {
  productsStore.setFilters({ page })
}

async function fetchBrands() {
  try {
    const { get } = await import('@/utils/api')
    const params: Record<string, unknown> = { limit: 1000 }
    if (activeCategory.value) params.category = activeCategory.value
    const data = await get<{ items: { brand: string }[] }>('/products', params)
    const items = data.items || []
    brands.value = [...new Set(items.map((p) => p.brand).filter(Boolean))]
  } catch {
    brands.value = []
  }
}

async function handleAddCart(productId: number | string) {
  try {
    await cartStore.addItem(productId, 1, 'product')
    ElMessage.success('已加入购物车')
  } catch {
    //
  }
}

function handleAddCompare(product: { id: number | string; name: string; price: number; images: string | string[]; stock: number; brand: string; categorySlug?: string; categoryName?: string; params?: string | Record<string, string> }) {
  const result = compareStore.addItem(product as any)
  if (result.ok) {
    ElMessage.success('已加入对比栏')
  } else {
    ElMessage.warning(result.msg || '无法加入对比')
  }
}

function goDetail(id: number | string) {
  router.push(`/products/${id}`)
}

function initFromQuery() {
  const querySearch = route.query.search as string
  if (querySearch) {
    searchKeyword.value = querySearch
  }
}

watch(
  () => route.query.search,
  (newSearch) => {
    const val = (newSearch as string) || ''
    if (val !== searchKeyword.value) {
      searchKeyword.value = val
      applyFilters()
    }
  },
)

onMounted(async () => {
  initFromQuery()
  if (searchKeyword.value) {
    applyFilters()
  } else {
    await productsStore.fetchProducts()
  }
  await fetchBrands()
})
</script>

<template>
  <div class="products-page">
    <aside class="filter-panel">
      <div v-if="isSearchMode" class="search-info">
        <div class="search-info-header">
          <svg class="search-info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span class="search-info-title">搜索结果</span>
        </div>
        <div class="search-info-keyword">"{{ searchKeyword }}"</div>
        <div class="search-info-count">共 {{ productsStore.total }} 个结果</div>
        <button class="search-clear-btn" @click="clearSearch">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          清除搜索
        </button>
      </div>

      <h3 class="section-title">筛选</h3>

      <div class="filter-section">
        <div class="filter-label">分类</div>
        <div class="category-tabs">
          <button
            v-for="tab in categoryTabs"
            :key="tab.value"
            class="cat-tab"
            :class="{ active: activeCategory === tab.value }"
            @click="handleCategoryChange(tab.value)"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <div class="filter-section">
        <div class="filter-label">品牌</div>
        <el-checkbox-group v-model="selectedBrands" @change="handleBrandChange">
          <el-checkbox
            v-for="brand in brands"
            :key="brand"
            :label="brand"
            :value="brand"
          />
        </el-checkbox-group>
      </div>

      <div class="filter-section">
        <div class="filter-label">价格范围</div>
        <el-slider
          v-model="priceRange"
          range
          :min="0"
          :max="1000"
          :step="10"
          @change="handlePriceChange"
        />
        <div class="price-display">
          ¥{{ priceRange[0] }} - ¥{{ priceRange[1] }}
        </div>
      </div>

      <div class="filter-section">
        <div class="filter-label">排序</div>
        <el-select v-model="sortValue" @change="handleSortChange" class="sort-select">
          <el-option
            v-for="opt in sortOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </div>

      <button class="cyber-btn reset-btn" @click="handleReset">重置筛选</button>
    </aside>

    <main class="products-main">
      <div v-if="productsStore.loading" class="loading-state">
        <el-icon class="is-loading" :size="32"><svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 64a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V96a32 32 0 0 1 32-32zm0 640a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V736a32 32 0 0 1 32-32zM195.2 195.2a32 32 0 0 1 45.248 0l135.808 135.808a32 32 0 0 1-45.248 45.248L195.2 240.448a32 32 0 0 1 0-45.248zm452.544 452.544a32 32 0 0 1 45.248 0l135.808 135.808a32 32 0 0 1-45.248 45.248L647.744 693.248a32 32 0 0 1 0-45.248zM64 512a32 32 0 0 1 32-32h192a32 32 0 0 1 0 64H96a32 32 0 0 1-32-32zm640 0a32 32 0 0 1 32-32h192a32 32 0 0 1 0 64H736a32 32 0 0 1-32-32zM195.2 828.8a32 32 0 0 1 0-45.248l135.808-135.808a32 32 0 0 1 45.248 45.248L240.448 828.8a32 32 0 0 1-45.248 0zm452.544-452.544a32 32 0 0 1 0-45.248l135.808-135.808a32 32 0 0 1 45.248 45.248L693.248 376.256a32 32 0 0 1-45.248 0z" fill="currentColor"/></svg></el-icon>
      </div>

      <div v-else-if="productsStore.products.length === 0" class="empty-state">
        <p>暂无商品</p>
      </div>

      <div v-else class="product-grid">
        <div
          v-for="product in productsStore.products"
          :key="product.id"
          class="product-card cyber-card"
        >
          <div class="card-image" @click="goDetail(product.id)">
            <div class="image-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--cc-cyan)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <line x1="6" y1="10" x2="6" y2="10.01" />
                <line x1="10" y1="10" x2="10" y2="10.01" />
                <line x1="14" y1="10" x2="14" y2="10.01" />
                <line x1="18" y1="10" x2="18" y2="10.01" />
                <line x1="8" y1="14" x2="16" y2="14" />
              </svg>
            </div>
          </div>
          <div class="card-body">
            <h4 class="card-name" @click="goDetail(product.id)">{{ product.name }}</h4>
            <span class="tag-cyan">{{ product.brand }}</span>
            <div class="card-price">¥{{ product.price }}</div>
            <div class="card-stock">
              <span class="stock-dot" :class="product.stock > 0 ? 'in-stock' : 'out-stock'"></span>
              <span class="stock-text">{{ product.stock > 0 ? '有货' : '缺货' }}</span>
            </div>
            <div class="card-actions">
              <button
                class="cyber-btn-primary add-cart-btn"
                :disabled="product.stock <= 0"
                @click="handleAddCart(product.id)"
              >
                加入购物车
              </button>
              <button
                class="add-compare-btn"
                :class="{ active: compareStore.isInCompare(product.id) }"
                @click="handleAddCompare(product)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                {{ compareStore.isInCompare(product.id) ? '已加入' : '对比' }}
              </button>
              <a class="detail-link" @click.prevent="goDetail(product.id)">详情</a>
            </div>
          </div>
        </div>
      </div>

      <div v-if="totalPages > 1" class="pagination-wrap">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="productsStore.total"
          :page-size="productsStore.filters.limit"
          :current-page="productsStore.filters.page"
          @current-change="handlePageChange"
        />
      </div>
    </main>
  </div>
</template>

<style scoped>
.products-page {
  display: flex;
  gap: 24px;
  min-height: 600px;
}

.filter-panel {
  width: 260px;
  flex-shrink: 0;
  position: sticky;
  top: 84px;
  align-self: flex-start;
  background: var(--cc-card);
  border: 1px solid var(--cc-border);
  border-radius: 0.5rem;
  padding: 1.25rem;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.search-info {
  background: rgba(0, 255, 255, 0.06);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 1rem;
}

.search-info-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.search-info-icon {
  width: 16px;
  height: 16px;
  color: var(--cc-cyan);
}

.search-info-title {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--cc-cyan);
}

.search-info-keyword {
  font-size: 0.85rem;
  color: var(--cc-white);
  margin-bottom: 4px;
  word-break: break-all;
}

.search-info-count {
  font-size: 0.75rem;
  color: var(--cc-text-dim);
  margin-bottom: 10px;
}

.search-clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  padding: 6px 10px;
  background: transparent;
  border: 1px solid rgba(0, 255, 255, 0.25);
  color: var(--cc-cyan-dim);
  font-size: 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.search-clear-btn:hover {
  background: rgba(0, 255, 255, 0.1);
  color: var(--cc-cyan);
  border-color: var(--cc-cyan);
}

.search-clear-btn svg {
  width: 12px;
  height: 12px;
}

.filter-section {
  margin-bottom: 1.25rem;
}

.filter-label {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--cc-white);
  margin-bottom: 0.5rem;
}

.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cat-tab {
  padding: 4px 12px;
  border: 1px solid var(--cc-border);
  background: transparent;
  color: var(--cc-text);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.cat-tab:hover {
  border-color: var(--cc-cyan-dim);
  color: var(--cc-cyan);
}

.cat-tab.active {
  border-color: var(--cc-cyan);
  color: var(--cc-cyan);
  background: rgba(125, 253, 254, 0.1);
  box-shadow: 0 0 6px var(--cc-cyan-glow);
}

.price-display {
  font-size: 0.8rem;
  color: var(--cc-text-dim);
  margin-top: 4px;
}

.sort-select {
  width: 100%;
}

.reset-btn {
  width: 100%;
  margin-top: 0.5rem;
}

.products-main {
  flex: 1;
  min-width: 0;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.product-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.card-image {
  cursor: pointer;
}

.image-placeholder {
  width: 100%;
  aspect-ratio: 4/3;
  background: linear-gradient(135deg, rgba(125, 253, 254, 0.08), rgba(125, 253, 254, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  margin-bottom: 0.75rem;
}

.image-placeholder svg {
  width: 40px;
  height: 40px;
  opacity: 0.6;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-name {
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-name:hover {
  color: var(--cc-cyan);
}

.card-price {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--cc-cyan);
}

.card-stock {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stock-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.stock-dot.in-stock {
  background: var(--cc-success);
  box-shadow: 0 0 6px var(--cc-success);
}

.stock-dot.out-stock {
  background: var(--cc-danger);
  box-shadow: 0 0 6px var(--cc-danger);
}

.stock-text {
  font-size: 0.8rem;
  color: var(--cc-text-dim);
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.add-compare-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 5px 10px;
  border: 1px solid var(--cc-border);
  background: transparent;
  color: var(--cc-text-dim);
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.add-compare-btn svg {
  width: 13px;
  height: 13px;
}

.add-compare-btn:hover {
  border-color: var(--cc-cyan-dim);
  color: var(--cc-cyan);
}

.add-compare-btn.active {
  border-color: var(--cc-cyan);
  color: var(--cc-cyan);
  background: rgba(125, 253, 254, 0.1);
}

.add-cart-btn {
  padding: 6px 14px;
  font-size: 0.8rem;
}

.add-cart-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.detail-link {
  font-size: 0.8rem;
  color: var(--cc-cyan-dim);
  cursor: pointer;
  text-decoration: none;
  transition: color 0.2s;
}

.detail-link:hover {
  color: var(--cc-cyan);
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.loading-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: var(--cc-text-dim);
  font-size: 1rem;
}

@media (max-width: 1024px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .products-page {
    flex-direction: column;
  }
  .filter-panel {
    width: 100%;
    position: static;
  }
  .product-grid {
    grid-template-columns: 1fr;
  }
}
</style>
