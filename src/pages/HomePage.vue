<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { get } from '@/utils/api'
import { formatProduct, parseImages } from '@/stores/products'
import { Keyboard, Box, Cpu, Cable, Heart, ArrowRight, Zap } from 'lucide-vue-next'
import type { Product } from '@/stores/products'

const router = useRouter()

interface RawScheme {
  id: number
  name: string
  username: string
  switchName: string | null
  keycapName: string | null
  caseName: string | null
  cableName: string | null
  switchPrice: number | null
  keycapPrice: number | null
  casePrice: number | null
  cablePrice: number | null
  switchImage: string | string[] | null
  keycapImage: string | string[] | null
  caseImage: string | string[] | null
  cableImage: string | string[] | null
  favoriteCount: number
}

interface Scheme extends RawScheme {
  switchImages: string[]
  keycapImages: string[]
  caseImages: string[]
  cableImages: string[]
  totalPrice: number
}

const popularSchemes = ref<Scheme[]>([])
const newProducts = ref<Product[]>([])
const schemesLoading = ref(false)
const productsLoading = ref(false)

const quickEntries = [
  { label: '轴体', category: 'switch', icon: Cpu, desc: '机械轴体 · 触感定制' },
  { label: '键帽', category: 'keycap', icon: Keyboard, desc: '个性键帽 · 色彩搭配' },
  { label: '外壳', category: 'case', icon: Box, desc: '精工外壳 · 材质选择' },
  { label: '线材', category: 'cable', icon: Cable, desc: '定制线材 · 接口丰富' },
]

function formatScheme(raw: RawScheme): Scheme {
  return {
    ...raw,
    switchImages: parseImages(raw.switchImage),
    keycapImages: parseImages(raw.keycapImage),
    caseImages: parseImages(raw.caseImage),
    cableImages: parseImages(raw.cableImage),
    totalPrice: (raw.switchPrice || 0) + (raw.keycapPrice || 0) + (raw.casePrice || 0) + (raw.cablePrice || 0),
  }
}

function calcTotalPrice(scheme: Scheme): number {
  return scheme.totalPrice
}

onMounted(async () => {
  schemesLoading.value = true
  productsLoading.value = true
  try {
    const data = await get<{ schemes: RawScheme[] }>('/schemes/popular')
    popularSchemes.value = (data.schemes || []).map(formatScheme)
  } catch {
    popularSchemes.value = []
  } finally {
    schemesLoading.value = false
  }
  try {
    const data = await get<{ items: Record<string, unknown>[]; pagination: { total: number } }>('/products', { sort: 'newest', limit: 8 } as unknown as Record<string, unknown>)
    newProducts.value = (data.items || []).map(formatProduct)
  } catch {
    newProducts.value = []
  } finally {
    productsLoading.value = false
  }
})
</script>

<template>
  <div class="home-page">
    <section class="hero">
      <div class="hero-bg-pattern"></div>
      <div class="hero-scan-line"></div>

      <svg class="hero-keyboard-svg" viewBox="0 0 800 260" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="60" y="40" width="680" height="180" rx="12" stroke="#7DFDFE" stroke-width="1.5" fill="none" opacity="0.3" />
        <rect x="80" y="60" width="44" height="44" rx="4" stroke="#7DFDFE" stroke-width="1" fill="none" opacity="0.25" />
        <rect x="132" y="60" width="44" height="44" rx="4" stroke="#7DFDFE" stroke-width="1" fill="none" opacity="0.25" />
        <rect x="184" y="60" width="44" height="44" rx="4" stroke="#7DFDFE" stroke-width="1" fill="none" opacity="0.25" />
        <rect x="236" y="60" width="44" height="44" rx="4" stroke="#7DFDFE" stroke-width="1" fill="none" opacity="0.25" />
        <rect x="288" y="60" width="44" height="44" rx="4" stroke="#7DFDFE" stroke-width="1" fill="none" opacity="0.25" />
        <rect x="340" y="60" width="44" height="44" rx="4" stroke="#7DFDFE" stroke-width="1" fill="none" opacity="0.25" />
        <rect x="392" y="60" width="44" height="44" rx="4" stroke="#7DFDFE" stroke-width="1" fill="none" opacity="0.25" />
        <rect x="444" y="60" width="44" height="44" rx="4" stroke="#7DFDFE" stroke-width="1" fill="none" opacity="0.25" />
        <rect x="496" y="60" width="44" height="44" rx="4" stroke="#7DFDFE" stroke-width="1" fill="none" opacity="0.25" />
        <rect x="548" y="60" width="44" height="44" rx="4" stroke="#7DFDFE" stroke-width="1" fill="none" opacity="0.25" />
        <rect x="600" y="60" width="44" height="44" rx="4" stroke="#7DFDFE" stroke-width="1" fill="none" opacity="0.25" />
        <rect x="652" y="60" width="44" height="44" rx="4" stroke="#7DFDFE" stroke-width="1" fill="none" opacity="0.25" />
        <rect x="80" y="112" width="44" height="44" rx="4" stroke="#7DFDFE" stroke-width="1" fill="none" opacity="0.2" />
        <rect x="132" y="112" width="44" height="44" rx="4" stroke="#7DFDFE" stroke-width="1" fill="none" opacity="0.2" />
        <rect x="184" y="112" width="44" height="44" rx="4" stroke="#7DFDFE" stroke-width="1" fill="none" opacity="0.2" />
        <rect x="236" y="112" width="44" height="44" rx="4" stroke="#7DFDFE" stroke-width="1" fill="none" opacity="0.2" />
        <rect x="288" y="112" width="44" height="44" rx="4" stroke="#7DFDFE" stroke-width="1" fill="none" opacity="0.2" />
        <rect x="340" y="112" width="44" height="44" rx="4" stroke="#7DFDFE" stroke-width="1" fill="none" opacity="0.2" />
        <rect x="392" y="112" width="44" height="44" rx="4" stroke="#7DFDFE" stroke-width="1" fill="none" opacity="0.2" />
        <rect x="444" y="112" width="44" height="44" rx="4" stroke="#7DFDFE" stroke-width="1" fill="none" opacity="0.2" />
        <rect x="496" y="112" width="220" height="44" rx="4" stroke="#7DFDFE" stroke-width="1" fill="none" opacity="0.2" />
        <line x1="60" y1="170" x2="740" y2="170" stroke="#7DFDFE" stroke-width="0.5" opacity="0.15" />
      </svg>

      <div class="hero-content">
        <h1 class="glitch-text hero-title" data-text="CYBERCRAFT">CYBERCRAFT</h1>
        <p class="hero-subtitle">赛博浅青 · 数码外设定制改装平台</p>
        <div class="hero-actions">
          <router-link to="/builder" class="cyber-btn-primary hero-btn">
            <Zap :size="18" style="margin-right: 6px" />
            开始客制化
          </router-link>
          <router-link to="/products" class="cyber-btn hero-btn">
            浏览配件
            <ArrowRight :size="16" style="margin-left: 6px" />
          </router-link>
        </div>
      </div>
    </section>

    <section class="section schemes-section">
      <h2 class="section-title">热门搭配方案</h2>
      <div v-if="schemesLoading" class="loading-row">
        <el-skeleton :rows="3" animated />
      </div>
      <div v-else-if="popularSchemes.length" class="schemes-grid">
        <div v-for="scheme in popularSchemes" :key="scheme.id" class="cyber-card scheme-card">
          <h3 class="scheme-name">{{ scheme.name }}</h3>
          <div class="scheme-parts">
            <div class="part-item">
              <span class="part-label">轴体</span>
              <span class="part-value">{{ scheme.switchName || '-' }}</span>
            </div>
            <div class="part-item">
              <span class="part-label">键帽</span>
              <span class="part-value">{{ scheme.keycapName || '-' }}</span>
            </div>
            <div class="part-item">
              <span class="part-label">外壳</span>
              <span class="part-value">{{ scheme.caseName || '-' }}</span>
            </div>
            <div class="part-item">
              <span class="part-label">线材</span>
              <span class="part-value">{{ scheme.cableName || '-' }}</span>
            </div>
          </div>
          <div class="scheme-footer">
            <span class="scheme-fav">
              <Heart :size="14" />
              {{ scheme.favoriteCount }}
            </span>
            <span class="scheme-price">¥{{ calcTotalPrice(scheme).toLocaleString() }}</span>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无热门方案" />
    </section>

    <section class="section arrivals-section">
      <h2 class="section-title">新品上架</h2>
      <div v-if="productsLoading" class="loading-row">
        <el-skeleton :rows="2" animated />
      </div>
      <div v-else-if="newProducts.length" class="arrivals-scroll">
        <div v-for="product in newProducts" :key="product.id" class="cyber-card arrival-card" @click="router.push(`/products/${product.id}`)">
          <div class="arrival-image">
            <span class="arrival-image-text">{{ product.name }}</span>
          </div>
          <div class="arrival-info">
            <p class="arrival-name">{{ product.name }}</p>
            <span class="tag-cyan">{{ product.brand || product.categoryName }}</span>
            <p class="arrival-price">¥{{ product.price.toLocaleString() }}</p>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无新品" />
    </section>

    <section class="section quick-section">
      <h2 class="section-title">快捷入口</h2>
      <div class="quick-grid">
        <div
          v-for="entry in quickEntries"
          :key="entry.category"
          class="cyber-card quick-card"
          @click="router.push(`/products?category=${entry.category}`)"
        >
          <div class="quick-icon">
            <component :is="entry.icon" :size="32" />
          </div>
          <h3 class="quick-label">{{ entry.label }}</h3>
          <p class="quick-desc">{{ entry.desc }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  margin: -24px;
}

.hero {
  position: relative;
  min-height: 520px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px 60px;
  background: linear-gradient(180deg, #0a0e17 0%, #1A1D23 70%, #0d1321 100%);
  overflow: hidden;
}

.hero-bg-pattern {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(125, 253, 254, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(125, 253, 254, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
}

.hero-bg-pattern::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 25% 25%, rgba(125, 253, 254, 0.04) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(125, 253, 254, 0.03) 0%, transparent 50%);
}

.hero-scan-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(125, 253, 254, 0.6), transparent);
  animation: scanLine 4s linear infinite;
  pointer-events: none;
}

.hero-keyboard-svg {
  position: absolute;
  width: 55%;
  max-width: 600px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.15;
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
}

.hero-title {
  font-size: 4.5rem;
  font-weight: 700;
  letter-spacing: 8px;
  line-height: 1.1;
  margin-bottom: 16px;
  text-shadow: 0 0 20px rgba(125, 253, 254, 0.4), 0 0 60px rgba(125, 253, 254, 0.15);
}

.hero-subtitle {
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 1.1rem;
  color: var(--cc-text-dim);
  margin-bottom: 40px;
  letter-spacing: 4px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.hero-btn {
  padding: 12px 32px;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  letter-spacing: 1px;
}

.section {
  padding: 48px 24px;
}

.schemes-section {
  max-width: 1280px;
  margin: 0 auto;
}

.schemes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.scheme-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.scheme-name {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--cc-white);
}

.scheme-parts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.part-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.part-label {
  font-size: 0.7rem;
  color: var(--cc-cyan-dim);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.part-value {
  font-size: 0.85rem;
  color: var(--cc-text);
}

.scheme-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid var(--cc-border);
}

.scheme-fav {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--cc-text-dim);
  font-size: 0.85rem;
}

.scheme-price {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--cc-cyan);
}

.arrivals-section {
  max-width: 1280px;
  margin: 0 auto;
}

.arrivals-scroll {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
  scroll-snap-type: x mandatory;
}

.arrivals-scroll::-webkit-scrollbar {
  height: 4px;
}

.arrival-card {
  flex: 0 0 220px;
  cursor: pointer;
  padding: 0;
  overflow: hidden;
  scroll-snap-align: start;
}

.arrival-image {
  height: 140px;
  background: linear-gradient(135deg, #1a2a3a 0%, #0d1f2d 50%, #1A1D23 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.arrival-image::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 40%, rgba(125, 253, 254, 0.05) 100%);
}

.arrival-image::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(125, 253, 254, 0.3), transparent);
}

.arrival-image-text {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem;
  color: var(--cc-cyan-dim);
  text-align: center;
  padding: 0 12px;
  opacity: 0.7;
}

.arrival-info {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.arrival-name {
  font-size: 0.9rem;
  color: var(--cc-white);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.arrival-price {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--cc-cyan);
  margin: 0;
}

.quick-section {
  max-width: 1280px;
  margin: 0 auto;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.quick-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
  cursor: pointer;
  padding: 28px 16px;
  transition: box-shadow 0.3s ease, border-color 0.3s ease, transform 0.2s ease;
}

.quick-card:hover {
  transform: translateY(-4px);
}

.quick-icon {
  color: var(--cc-cyan);
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--cc-border);
  border-radius: 12px;
  background: rgba(125, 253, 254, 0.05);
  transition: all 0.3s ease;
}

.quick-card:hover .quick-icon {
  border-color: var(--cc-cyan);
  box-shadow: 0 0 15px var(--cc-cyan-glow);
  background: rgba(125, 253, 254, 0.1);
}

.quick-label {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--cc-white);
}

.quick-desc {
  font-size: 0.78rem;
  color: var(--cc-text-dim);
  margin: 0;
  line-height: 1.4;
}

.loading-row {
  padding: 20px 0;
}

@media (max-width: 1024px) {
  .schemes-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .quick-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .hero-title {
    font-size: 2.8rem;
    letter-spacing: 4px;
  }
  .schemes-grid {
    grid-template-columns: 1fr;
  }
  .quick-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
}
</style>
