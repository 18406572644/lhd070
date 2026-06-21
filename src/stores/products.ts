import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { get } from '@/utils/api'

export interface Product {
  id: number | string
  name: string
  price: number
  images: string | string[]
  stock: number
  categoryName?: string
  categorySlug?: string
  categoryId?: number | string
  brand: string
  params?: string | Record<string, string>
  createdAt?: string
  [key: string]: unknown
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface Filters {
  category: string
  brand: string
  minPrice: number
  maxPrice: number
  sort: string
  page: number
  limit: number
}

const defaultFilters: Filters = {
  category: '',
  brand: '',
  minPrice: 0,
  maxPrice: 0,
  sort: 'newest',
  page: 1,
  limit: 12,
}

export function parseImages(raw: string | string[] | undefined): string[] {
  if (!raw) return []
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as string[]
    } catch {
      return []
    }
  }
  return raw
}

export function parseParams(raw: string | Record<string, string> | undefined): Record<string, string> {
  if (!raw) return {}
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, string>
    } catch {
      return {}
    }
  }
  return raw
}

export function formatProduct(p: Record<string, unknown>): Product {
  return {
    ...(p as Product),
    images: parseImages(p.images as string | string[]),
    params: parseParams(p.params as string | Record<string, string>),
  }
}

export const useProductsStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const currentProduct = ref<Product | null>(null)
  const categories = ref<{ id: number | string; name: string; slug: string }[]>([
    { id: 1, name: '轴体', slug: 'switch' },
    { id: 2, name: '键帽', slug: 'keycap' },
    { id: 3, name: '外壳', slug: 'case' },
    { id: 4, name: '线材', slug: 'cable' },
  ])
  const total = ref(0)
  const loading = ref(false)
  const filters = ref<Filters>({ ...defaultFilters })

  const categoryList = computed(() => categories.value)

  async function fetchProducts() {
    loading.value = true
    try {
      const params: Record<string, string | number> = {}
      const f = filters.value
      if (f.category) params.category = f.category
      if (f.brand) params.brand = f.brand
      if (f.minPrice > 0) params.minPrice = f.minPrice
      if (f.maxPrice > 0) params.maxPrice = f.maxPrice
      if (f.sort) params.sort = f.sort
      params.page = f.page
      params.limit = f.limit

      const data = await get<{ items: Record<string, unknown>[]; pagination: Pagination }>(
        '/products',
        { params },
      )
      products.value = data.items.map(formatProduct)
      total.value = data.pagination.total
    } finally {
      loading.value = false
    }
  }

  async function fetchProduct(id: number | string) {
    loading.value = true
    try {
      const data = await get<{ product: Record<string, unknown> }>(`/products/${id}`)
      currentProduct.value = formatProduct(data.product)
    } finally {
      loading.value = false
    }
  }

  async function fetchByCategory(categorySlug: string, limit = 100): Promise<Product[]> {
    const data = await get<{ items: Record<string, unknown>[]; pagination: Pagination }>(
      '/products',
      { params: { category: categorySlug, limit } },
    )
    return data.items.map(formatProduct)
  }

  function setFilters(partial: Partial<Filters>) {
    Object.assign(filters.value, partial)
    filters.value.page = 1
  }

  function resetFilters() {
    Object.assign(filters.value, { ...defaultFilters })
  }

  return {
    products,
    currentProduct,
    categories,
    total,
    loading,
    filters,
    categoryList,
    fetchProducts,
    fetchProduct,
    fetchByCategory,
    setFilters,
    resetFilters,
  }
})
