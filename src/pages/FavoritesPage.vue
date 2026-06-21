<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { get, post, del } from '@/utils/api'
import { useCartStore } from '@/stores/cart'

interface RawScheme {
  id: number | string
  name: string
  switchName?: string | null
  keycapName?: string | null
  caseName?: string | null
  cableName?: string | null
  switchImage?: string | string[] | null
  keycapImage?: string | string[] | null
  caseImage?: string | string[] | null
  cableImage?: string | string[] | null
  accessories?: string[]
  favoriteCount: number
  isFavorited: boolean
}

interface Scheme {
  id: number | string
  name: string
  accessories: string[]
  favoriteCount: number
  isFavorited: boolean
}

const router = useRouter()
const cartStore = useCartStore()
const schemes = ref<Scheme[]>([])
const loading = ref(false)

function formatScheme(raw: RawScheme): Scheme {
  const accessories = raw.accessories || [
    raw.switchName,
    raw.keycapName,
    raw.caseName,
    raw.cableName,
  ].filter(Boolean) as string[]
  return {
    id: raw.id,
    name: raw.name,
    accessories,
    favoriteCount: raw.favoriteCount,
    isFavorited: raw.isFavorited,
  }
}

async function fetchSchemes() {
  loading.value = true
  try {
    const [schemesData, favData] = await Promise.all([
      get<{ schemes: RawScheme[] }>('/schemes'),
      get<number[]>('/favorites'),
    ])
    const favIds = new Set((favData || []).map(Number))
    schemes.value = (schemesData.schemes || [])
      .filter((s) => favIds.has(Number(s.id)))
      .map(formatScheme)
  } finally {
    loading.value = false
  }
}

async function unfavorite(id: number | string) {
  try {
    await ElMessageBox.confirm('确定取消收藏该方案？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await del(`/favorites/${id}`)
    ElMessage.success('已取消收藏')
    schemes.value = schemes.value.filter((s) => s.id !== id)
  } catch {
    // cancelled
  }
}

async function addToCart(scheme: Scheme) {
  try {
    await cartStore.addItem(scheme.id, 1, 'kit')
    ElMessage.success('已加入购物车')
  } catch {
    // handled by interceptor
  }
}

function goBuilder() {
  router.push('/builder')
}

onMounted(fetchSchemes)
</script>

<template>
  <div class="favorites-page animate-fade-in">
    <h2 class="section-title">我的收藏</h2>

    <div v-loading="loading" class="schemes-grid">
      <div v-for="scheme in schemes" :key="scheme.id" class="scheme-card cyber-card">
        <h3 class="scheme-name">{{ scheme.name }}</h3>
        <div class="scheme-accessories">
          <el-tag
            v-for="(acc, idx) in scheme.accessories"
            :key="idx"
            size="small"
            effect="plain"
            class="acc-tag"
          >
            {{ acc }}
          </el-tag>
        </div>
        <div class="scheme-meta">
          <span class="fav-count">♥ {{ scheme.favoriteCount }}</span>
        </div>
        <div class="scheme-actions">
          <el-button size="small" type="danger" plain @click="unfavorite(scheme.id)">
            取消收藏
          </el-button>
          <el-button size="small" type="primary" @click="addToCart(scheme)">
            加入购物车
          </el-button>
        </div>
      </div>
    </div>

    <div v-if="!loading && schemes.length === 0" class="empty-state">
      <el-empty description="还没有收藏的方案">
        <el-button type="primary" @click="goBuilder">去选配中心</el-button>
      </el-empty>
    </div>
  </div>
</template>

<style scoped>
.favorites-page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.schemes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
}

.scheme-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.scheme-name {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--cc-white);
}

.scheme-accessories {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.acc-tag {
  border-color: var(--cc-border);
  color: var(--cc-text);
  background: transparent;
}

.scheme-meta {
  font-size: 0.85rem;
  color: var(--cc-text-dim);
}

.fav-count {
  color: var(--cc-danger);
}

.scheme-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
}

.empty-state {
  margin-top: 4rem;
}
</style>
