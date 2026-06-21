import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Product } from '@/stores/products'
import { parseImages, parseParams } from '@/stores/products'

export interface CompareItem {
  id: number | string
  name: string
  price: number
  images: string[]
  stock: number
  brand: string
  categorySlug: string
  categoryName: string
  params: Record<string, string>
}

const MAX_COMPARE = 4

export const useCompareStore = defineStore('compare', () => {
  const items = ref<CompareItem[]>([])

  const count = computed(() => items.value.length)
  const currentCategory = computed(() => items.value.length > 0 ? items.value[0].categorySlug : '')
  const currentCategoryName = computed(() => items.value.length > 0 ? items.value[0].categoryName : '')
  const canCompare = computed(() => items.value.length >= 2)

  function productToCompareItem(p: Product): CompareItem {
    return {
      id: p.id,
      name: p.name,
      price: p.price,
      images: parseImages(p.images),
      stock: p.stock,
      brand: p.brand,
      categorySlug: p.categorySlug || '',
      categoryName: p.categoryName || '',
      params: parseParams(p.params),
    }
  }

  function isInCompare(productId: number | string): boolean {
    return items.value.some((item) => String(item.id) === String(productId))
  }

  function addItem(product: Product): { ok: boolean; msg?: string } {
    if (isInCompare(product.id)) {
      return { ok: false, msg: '该配件已在对比栏中' }
    }
    if (items.value.length >= MAX_COMPARE) {
      return { ok: false, msg: `对比栏最多添加 ${MAX_COMPARE} 个配件` }
    }
    const slug = product.categorySlug || ''
    if (items.value.length > 0 && currentCategory.value && slug !== currentCategory.value) {
      return { ok: false, msg: '只能对比同分类的配件' }
    }
    items.value.push(productToCompareItem(product))
    return { ok: true }
  }

  function removeItem(productId: number | string) {
    items.value = items.value.filter((item) => String(item.id) !== String(productId))
  }

  function clearAll() {
    items.value = []
  }

  return {
    items,
    count,
    currentCategory,
    currentCategoryName,
    canCompare,
    isInCompare,
    addItem,
    removeItem,
    clearAll,
  }
})
