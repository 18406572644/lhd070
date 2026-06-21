<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCompareStore, type CompareItem } from '@/stores/compare'
import { useCartStore } from '@/stores/cart'
import { ElMessage } from 'element-plus'

const router = useRouter()
const compareStore = useCompareStore()
const cartStore = useCartStore()

const items = computed(() => compareStore.items)

const allParamKeys = computed(() => {
  const keySet = new Set<string>()
  for (const item of items.value) {
    for (const key of Object.keys(item.params)) {
      keySet.add(key)
    }
  }
  return [...keySet]
})

interface ParamRow {
  key: string
  values: string[]
  isDiff: boolean
}

const paramRows = computed<ParamRow[]>(() => {
  return allParamKeys.value.map((key) => {
    const values = items.value.map((item) => item.params[key] ?? '-')
    const nonEmpty = values.filter((v) => v !== '-')
    const isDiff = nonEmpty.length > 1 && new Set(nonEmpty).size > 1
    return { key, values, isDiff }
  })
})

async function handleAddCart(productId: number | string) {
  try {
    await cartStore.addItem(productId, 1, 'product')
    ElMessage.success('已加入购物车')
  } catch {
    //
  }
}

function goBuilder(productId: number | string) {
  router.push({ path: '/builder', query: { productId: String(productId) } })
}

function goDetail(productId: number | string) {
  router.push(`/products/${productId}`)
}

function goBack() {
  router.back()
}

function getImage(item: CompareItem): string {
  return item.images.length > 0 ? item.images[0] : ''
}
</script>

<template>
  <div class="compare-page">
    <div v-if="items.length < 2" class="empty-compare">
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--cc-cyan)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
      <p>请至少选择 2 个同分类配件进行对比</p>
      <button class="cyber-btn" @click="router.push('/products')">去选配件</button>
    </div>

    <template v-else>
      <div class="compare-header">
        <button class="cyber-btn back-btn" @click="goBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          返回
        </button>
        <h1 class="compare-title">
          {{ compareStore.currentCategoryName }} 对比
          <span class="compare-badge">{{ items.length }} 件</span>
        </h1>
        <div></div>
      </div>

      <div class="compare-table-wrap">
        <table class="compare-table">
          <thead>
            <tr>
              <th class="row-label">对比项</th>
              <th v-for="item in items" :key="item.id" class="product-col">
                <div class="product-head">
                  <div class="product-thumb" @click="goDetail(item.id)">
                    <img v-if="getImage(item)" :src="getImage(item)" :alt="item.name" />
                    <svg v-else viewBox="0 0 24 24" fill="none" stroke="var(--cc-cyan)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="2" y="6" width="20" height="12" rx="2" />
                      <line x1="8" y1="14" x2="16" y2="14" />
                    </svg>
                  </div>
                  <div class="product-head-name" @click="goDetail(item.id)">{{ item.name }}</div>
                  <button class="remove-btn" @click="compareStore.removeItem(item.id)" title="移除">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="row-label">图片</td>
              <td v-for="item in items" :key="'img-' + item.id">
                <div class="cell-image" @click="goDetail(item.id)">
                  <img v-if="getImage(item)" :src="getImage(item)" :alt="item.name" />
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="var(--cc-cyan)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <line x1="8" y1="14" x2="16" y2="14" />
                  </svg>
                </div>
              </td>
            </tr>
            <tr>
              <td class="row-label">名称</td>
              <td v-for="item in items" :key="'name-' + item.id">
                <span class="cell-name" @click="goDetail(item.id)">{{ item.name }}</span>
              </td>
            </tr>
            <tr>
              <td class="row-label">价格</td>
              <td v-for="item in items" :key="'price-' + item.id">
                <span class="cell-price">¥{{ item.price }}</span>
              </td>
            </tr>
            <tr>
              <td class="row-label">品牌</td>
              <td v-for="item in items" :key="'brand-' + item.id">
                <span class="tag-cyan">{{ item.brand }}</span>
              </td>
            </tr>
            <tr>
              <td class="row-label">库存</td>
              <td v-for="item in items" :key="'stock-' + item.id">
                <span class="stock-status">
                  <span class="stock-dot" :class="item.stock > 0 ? 'in-stock' : 'out-stock'"></span>
                  <span>{{ item.stock > 0 ? `有货 (${item.stock})` : '缺货' }}</span>
                </span>
              </td>
            </tr>
            <tr
              v-for="row in paramRows"
              :key="'param-' + row.key"
              :class="{ 'diff-row': row.isDiff }"
            >
              <td class="row-label">{{ row.key }}</td>
              <td v-for="(val, idx) in row.values" :key="'p-' + row.key + '-' + idx">
                {{ val }}
              </td>
            </tr>
            <tr class="action-row">
              <td class="row-label">操作</td>
              <td v-for="item in items" :key="'action-' + item.id">
                <div class="cell-actions">
                  <button
                    class="cyber-btn-primary cell-btn"
                    :disabled="item.stock <= 0"
                    @click="handleAddCart(item.id)"
                  >
                    加入购物车
                  </button>
                  <button class="cyber-btn cell-btn" @click="goBuilder(item.id)">去组装</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<style scoped>
.compare-page {
  animation: fadeInUp 0.5s ease;
}

.compare-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 1.5rem;
}

.compare-title {
  flex: 1;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.compare-badge {
  font-size: 0.75rem;
  padding: 2px 10px;
  background: rgba(0, 255, 255, 0.12);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 4px;
  color: var(--cc-cyan);
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 0.85rem;
}

.back-btn svg {
  width: 16px;
  height: 16px;
}

.compare-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--cc-border);
  border-radius: 8px;
  background: var(--cc-card);
}

.compare-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.compare-table th,
.compare-table td {
  padding: 12px 16px;
  text-align: center;
  border-bottom: 1px solid var(--cc-border);
  vertical-align: middle;
  font-size: 0.9rem;
  color: var(--cc-text);
}

.compare-table thead th {
  background: rgba(0, 0, 0, 0.2);
  position: sticky;
  top: 0;
  z-index: 1;
}

.row-label {
  text-align: left !important;
  font-weight: 600;
  color: var(--cc-white) !important;
  background: rgba(0, 0, 0, 0.15);
  white-space: nowrap;
  width: 100px;
  min-width: 100px;
}

.product-col {
  min-width: 180px;
}

.product-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
}

.product-thumb {
  width: 60px;
  height: 45px;
  border-radius: 4px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(125, 253, 254, 0.08), rgba(125, 253, 254, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.product-thumb svg {
  width: 28px;
  height: 28px;
  opacity: 0.5;
}

.product-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-head-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--cc-white);
  cursor: pointer;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-head-name:hover {
  color: var(--cc-cyan);
}

.remove-btn {
  position: absolute;
  top: -4px;
  right: -4px;
  background: rgba(255, 107, 107, 0.15);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--cc-danger);
  transition: all 0.2s;
}

.remove-btn:hover {
  background: rgba(255, 107, 107, 0.3);
}

.remove-btn svg {
  width: 12px;
  height: 12px;
}

.cell-image {
  width: 120px;
  height: 90px;
  margin: 0 auto;
  border-radius: 6px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(125, 253, 254, 0.08), rgba(125, 253, 254, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.cell-image svg {
  width: 40px;
  height: 40px;
  opacity: 0.5;
}

.cell-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cell-name {
  font-weight: 600;
  color: var(--cc-white);
  cursor: pointer;
  transition: color 0.2s;
}

.cell-name:hover {
  color: var(--cc-cyan);
}

.cell-price {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--cc-cyan);
}

.stock-status {
  display: inline-flex;
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

.diff-row td {
  background: rgba(0, 255, 255, 0.06) !important;
}

.diff-row .row-label {
  background: rgba(0, 255, 255, 0.12) !important;
  color: var(--cc-cyan) !important;
}

.action-row td {
  padding: 16px;
}

.cell-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.cell-btn {
  padding: 6px 14px;
  font-size: 0.8rem;
  width: 100%;
  max-width: 130px;
}

.cell-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.empty-compare {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 16px;
  color: var(--cc-text-dim);
}

.empty-compare svg {
  width: 48px;
  height: 48px;
  opacity: 0.4;
}

.empty-compare p {
  font-size: 1rem;
}
</style>
