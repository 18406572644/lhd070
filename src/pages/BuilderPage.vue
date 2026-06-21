<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { post } from '@/utils/api'
import { useProductsStore, formatProduct } from '@/stores/products'
import type { Product } from '@/stores/products'
import { useCartStore } from '@/stores/cart'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const cartStore = useCartStore()
const productsStore = useProductsStore()

const steps = [
  { label: '选轴体', category: 'switch' },
  { label: '选键帽', category: 'keycap' },
  { label: '选外壳', category: 'case' },
  { label: '选线材', category: 'cable' },
]

const currentStep = ref(0)
const stepProducts = ref<Record<string, Product[]>>({
  switch: [],
  keycap: [],
  case: [],
  cable: [],
})
const loading = ref(false)

const selectedSwitch = ref<Product | null>(null)
const selectedKeycap = ref<Product | null>(null)
const selectedCase = ref<Product | null>(null)
const selectedCable = ref<Product | null>(null)

const selectedMap: Record<string, typeof selectedSwitch> = {
  switch: selectedSwitch,
  keycap: selectedKeycap,
  case: selectedCase,
  cable: selectedCable,
}

const currentProducts = computed(() => {
  const cat = steps[currentStep.value].category
  return stepProducts.value[cat] || []
})

const totalPrice = computed(() => {
  let sum = 0
  if (selectedSwitch.value) sum += Number(selectedSwitch.value.price)
  if (selectedKeycap.value) sum += Number(selectedKeycap.value.price)
  if (selectedCase.value) sum += Number(selectedCase.value.price)
  if (selectedCable.value) sum += Number(selectedCable.value.price)
  return sum
})

async function fetchStepProducts(category: string) {
  try {
    stepProducts.value[category] = await productsStore.fetchByCategory(category, 100)
  } catch {
    stepProducts.value[category] = []
  }
}

function selectProduct(product: Product) {
  const cat = steps[currentStep.value].category
  const sel = selectedMap[cat]
  if (sel.value?.id === product.id) {
    sel.value = null
  } else {
    sel.value = product
  }
}

function isSelected(product: Product): boolean {
  const cat = steps[currentStep.value].category
  return selectedMap[cat].value?.id === product.id
}

function nextStep() {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

async function handleSaveScheme() {
  if (!selectedSwitch.value && !selectedKeycap.value && !selectedCase.value && !selectedCable.value) {
    ElMessage.warning('请至少选择一个配件')
    return
  }
  try {
    const { value: name } = await ElMessageBox.prompt('请输入方案名称', '保存方案', {
      confirmButtonText: '保存',
      cancelButtonText: '取消',
      inputPattern: /\S+/,
      inputErrorMessage: '方案名称不能为空',
    })
    await post('/schemes', {
      name,
      switchId: selectedSwitch.value?.id || null,
      keycapId: selectedKeycap.value?.id || null,
      caseId: selectedCase.value?.id || null,
      cableId: selectedCable.value?.id || null,
    })
    ElMessage.success('方案已保存')
  } catch {
    //
  }
}

async function handleAddKitToCart() {
  if (totalPrice.value === 0) {
    ElMessage.warning('请至少选择一个配件')
    return
  }
  const items = [
    selectedSwitch.value,
    selectedKeycap.value,
    selectedCase.value,
    selectedCable.value,
  ].filter(Boolean)
  try {
    for (const item of items) {
      await cartStore.addItem(item.id, 1, 'kit')
    }
    ElMessage.success('已加入购物车')
  } catch {
    //
  }
}

async function handleDirectOrder() {
  if (totalPrice.value === 0) {
    ElMessage.warning('请至少选择一个配件')
    return
  }
  await handleAddKitToCart()
  router.push('/checkout')
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all(steps.map((s) => fetchStepProducts(s.category)))
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="builder-page">
    <h2 class="page-title">客制化组装</h2>

    <div class="steps-bar">
      <div
        v-for="(step, idx) in steps"
        :key="idx"
        class="step-item"
        :class="{
          active: idx === currentStep,
          done: idx < currentStep,
        }"
        @click="currentStep = idx"
      >
        <div class="step-number">{{ idx + 1 }}</div>
        <span class="step-label">{{ step.label }}</span>
        <svg v-if="idx < steps.length - 1" class="step-connector" viewBox="0 0 40 2">
          <line x1="0" y1="1" x2="40" y2="1" :stroke="idx < currentStep ? 'var(--cc-cyan)' : 'var(--cc-border)'" stroke-width="2" />
        </svg>
      </div>
    </div>

    <div class="builder-body">
      <div class="step-content">
        <div v-if="loading" class="loading-state">
          <el-icon class="is-loading" :size="32"><svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 64a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V96a32 32 0 0 1 32-32zm0 640a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V736a32 32 0 0 1 32-32zM195.2 195.2a32 32 0 0 1 45.248 0l135.808 135.808a32 32 0 0 1-45.248 45.248L195.2 240.448a32 32 0 0 1 0-45.248zm452.544 452.544a32 32 0 0 1 45.248 0l135.808 135.808a32 32 0 0 1-45.248 45.248L647.744 693.248a32 32 0 0 1 0-45.248zM64 512a32 32 0 0 1 32-32h192a32 32 0 0 1 0 64H96a32 32 0 0 1-32-32zm640 0a32 32 0 0 1 32-32h192a32 32 0 0 1 0 64H736a32 32 0 0 1-32-32zM195.2 828.8a32 32 0 0 1 0-45.248l135.808-135.808a32 32 0 0 1 45.248 45.248L240.448 828.8a32 32 0 0 1-45.248 0zm452.544-452.544a32 32 0 0 1 0-45.248l135.808-135.808a32 32 0 0 1 45.248 45.248L693.248 376.256a32 32 0 0 1-45.248 0z" fill="currentColor"/></svg></el-icon>
        </div>

        <div v-else-if="currentProducts.length === 0" class="empty-state">
          <p>暂无该分类商品</p>
        </div>

        <div v-else class="product-grid">
          <div
            v-for="product in currentProducts"
            :key="product.id"
            class="builder-card cyber-card"
            :class="{ selected: isSelected(product) }"
            @click="selectProduct(product)"
          >
            <div class="card-image image-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--cc-cyan)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="32" height="32">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <line x1="8" y1="14" x2="16" y2="14" />
              </svg>
            </div>
            <div class="card-info">
              <div class="card-name">{{ product.name }}</div>
              <span class="tag-cyan">{{ product.brand }}</span>
              <div class="card-price">¥{{ product.price }}</div>
            </div>
          </div>
        </div>

        <div class="step-nav">
          <button v-if="currentStep > 0" class="cyber-btn" @click="prevStep">上一步</button>
          <div v-else></div>
          <button
            v-if="currentStep < steps.length - 1"
            class="cyber-btn-primary"
            @click="nextStep"
          >
            下一步
          </button>
          <div v-else></div>
        </div>
      </div>

      <aside class="preview-panel">
        <h3 class="section-title">方案预览</h3>
        <div class="preview-items">
          <div class="preview-item">
            <span class="preview-label">轴体</span>
            <span class="preview-value">{{ selectedSwitch?.name || '未选择' }}</span>
            <span class="preview-price" v-if="selectedSwitch">¥{{ selectedSwitch.price }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">键帽</span>
            <span class="preview-value">{{ selectedKeycap?.name || '未选择' }}</span>
            <span class="preview-price" v-if="selectedKeycap">¥{{ selectedKeycap.price }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">外壳</span>
            <span class="preview-value">{{ selectedCase?.name || '未选择' }}</span>
            <span class="preview-price" v-if="selectedCase">¥{{ selectedCase.price }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">线材</span>
            <span class="preview-value">{{ selectedCable?.name || '未选择' }}</span>
            <span class="preview-price" v-if="selectedCable">¥{{ selectedCable.price }}</span>
          </div>
        </div>
        <div class="total-row">
          <span class="total-label">总计</span>
          <span class="total-price">¥{{ totalPrice }}</span>
        </div>
      </aside>
    </div>

    <div class="action-bar">
      <button class="cyber-btn" @click="handleSaveScheme">保存方案</button>
      <button class="cyber-btn-primary" @click="handleAddKitToCart">加入购物车</button>
      <button class="cyber-btn-primary" @click="handleDirectOrder">直接下单</button>
    </div>
  </div>
</template>

<style scoped>
.builder-page {
  animation: fadeInUp 0.5s ease;
}

.page-title {
  font-size: 1.75rem;
  margin-bottom: 1.25rem;
}

.steps-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-bottom: 2rem;
  padding: 1rem;
  background: var(--cc-card);
  border: 1px solid var(--cc-border);
  border-radius: 0.5rem;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  position: relative;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--cc-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  color: var(--cc-text-dim);
  transition: all 0.3s;
  flex-shrink: 0;
}

.step-label {
  font-size: 0.9rem;
  color: var(--cc-text-dim);
  transition: color 0.3s;
  white-space: nowrap;
}

.step-item.active .step-number {
  border-color: var(--cc-cyan);
  color: var(--cc-cyan);
  box-shadow: 0 0 12px var(--cc-cyan-glow);
  background: rgba(125, 253, 254, 0.1);
}

.step-item.active .step-label {
  color: var(--cc-cyan);
  font-weight: 600;
}

.step-item.done .step-number {
  border-color: var(--cc-cyan-dim);
  color: var(--cc-dark);
  background: var(--cc-cyan);
}

.step-item.done .step-label {
  color: var(--cc-white);
}

.step-connector {
  width: 40px;
  height: 2px;
  margin: 0 8px;
  flex-shrink: 0;
}

.builder-body {
  display: flex;
  gap: 24px;
}

.step-content {
  flex: 1;
  min-width: 0;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.builder-card {
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
}

.builder-card.selected {
  border-color: var(--cc-cyan);
  box-shadow: 0 0 12px var(--cc-cyan-glow), 0 0 24px rgba(125, 253, 254, 0.15);
}

.card-image {
  width: 100%;
  aspect-ratio: 4/3;
  margin-bottom: 0.5rem;
}

.image-placeholder {
  background: linear-gradient(135deg, rgba(125, 253, 254, 0.08), rgba(125, 253, 254, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.card-info {
  text-align: center;
  width: 100%;
}

.card-name {
  font-size: 0.85rem;
  color: var(--cc-white);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-price {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--cc-cyan);
  margin-top: 4px;
}

.step-nav {
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
}

.preview-panel {
  width: 280px;
  flex-shrink: 0;
  position: sticky;
  top: 84px;
  align-self: flex-start;
  background: var(--cc-card);
  border: 1px solid var(--cc-border);
  border-radius: 0.5rem;
  padding: 1.25rem;
}

.preview-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 1rem;
}

.preview-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  border-radius: 4px;
  background: rgba(125, 253, 254, 0.03);
  border: 1px solid var(--cc-border);
}

.preview-label {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--cc-cyan);
  text-transform: uppercase;
}

.preview-value {
  font-size: 0.85rem;
  color: var(--cc-white);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-price {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem;
  color: var(--cc-cyan);
  font-weight: 600;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid var(--cc-border);
}

.total-label {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--cc-white);
}

.total-price {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--cc-cyan);
  text-shadow: 0 0 10px var(--cc-cyan-glow);
}

.action-bar {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 2rem;
  padding: 1.25rem;
  background: var(--cc-card);
  border: 1px solid var(--cc-border);
  border-radius: 0.5rem;
}

.loading-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: var(--cc-text-dim);
}

@media (max-width: 900px) {
  .builder-body {
    flex-direction: column;
  }
  .preview-panel {
    width: 100%;
    position: static;
  }
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .product-grid {
    grid-template-columns: 1fr;
  }
  .step-label {
    display: none;
  }
}
</style>
