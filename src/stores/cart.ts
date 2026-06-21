import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { get, post, put, del } from '@/utils/api'

interface ProductSnapshot {
  id: number | string
  name: string
  price: number
  images: string[]
  stock: number
  category: string
  brand: string
}

interface CartItem {
  id: number | string
  productId: number | string
  quantity: number
  type: string
  product: ProductSnapshot
}

interface RawCartItem {
  id: number | string
  productId: number | string
  quantity: number
  type: string
  name: string
  price: number
  images: string | string[]
  brand: string
  stock: number
  categoryName: string
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const loading = ref(false)
  const selectedIds = ref<Set<number | string>>(new Set())

  const totalCount = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
  const totalAmount = computed(() =>
    items.value.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  )
  const kitItems = computed(() => items.value.filter((item) => item.type === 'kit'))
  const productItems = computed(() => items.value.filter((item) => item.type === 'product'))

  const selectedItems = computed(() => items.value.filter((item) => selectedIds.value.has(item.id)))
  const selectedCount = computed(() => selectedItems.value.reduce((sum, item) => sum + item.quantity, 0))
  const selectedAmount = computed(() =>
    selectedItems.value.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  )
  const isAllSelected = computed(() => items.value.length > 0 && items.value.every((item) => selectedIds.value.has(item.id)))

  function parseImages(raw: string | string[] | undefined): string[] {
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

  function toNumericId(id: number | string): number {
    const num = Number(id)
    return Number.isNaN(num) ? 0 : num
  }

  function mapItem(raw: RawCartItem): CartItem {
    return {
      id: toNumericId(raw.id),
      productId: toNumericId(raw.productId),
      quantity: raw.quantity,
      type: raw.type,
      product: {
        id: toNumericId(raw.productId),
        name: raw.name,
        price: raw.price,
        images: parseImages(raw.images),
        stock: raw.stock,
        category: raw.categoryName,
        brand: raw.brand,
      },
    }
  }

  function toggleSelect(id: number | string) {
    const numericId = toNumericId(id)
    if (selectedIds.value.has(numericId)) {
      selectedIds.value.delete(numericId)
    } else {
      selectedIds.value.add(numericId)
    }
    selectedIds.value = new Set(selectedIds.value)
  }

  function toggleSelectAll() {
    if (isAllSelected.value) {
      selectedIds.value = new Set()
    } else {
      selectedIds.value = new Set(items.value.map((item) => toNumericId(item.id)))
    }
  }

  function clearSelection() {
    selectedIds.value = new Set()
  }

  async function fetchCart() {
    loading.value = true
    try {
      const data = await get<{ items: RawCartItem[] }>('/cart')
      items.value = data.items.map(mapItem)
      const validIds = new Set(items.value.map((item) => toNumericId(item.id)))
      selectedIds.value = new Set(
        [...selectedIds.value]
          .map((id) => toNumericId(id))
          .filter((id) => validIds.has(id)),
      )
    } finally {
      loading.value = false
    }
  }

  async function addItem(productId: number | string, quantity: number, type: string) {
    loading.value = true
    try {
      await post('/cart/items', { productId, quantity, type })
      await fetchCart()
    } finally {
      loading.value = false
    }
  }

  async function updateQuantity(id: number | string, quantity: number) {
    loading.value = true
    try {
      const numericId = toNumericId(id)
      await put(`/cart/items/${numericId}`, { quantity })
      await fetchCart()
    } finally {
      loading.value = false
    }
  }

  async function removeItem(id: number | string) {
    loading.value = true
    try {
      const numericId = toNumericId(id)
      await del(`/cart/items/${numericId}`)
      selectedIds.value.delete(numericId)
      await fetchCart()
    } finally {
      loading.value = false
    }
  }

  async function removeSelected() {
    if (selectedIds.value.size === 0) return
    loading.value = true
    try {
      const numericIds = [...selectedIds.value].map((id) => Number(id))
      await post('/cart/items/batch-delete', { ids: numericIds })
      selectedIds.value = new Set()
      await fetchCart()
    } finally {
      loading.value = false
    }
  }

  async function clearCart() {
    loading.value = true
    try {
      await del('/cart')
      selectedIds.value = new Set()
      await fetchCart()
    } finally {
      loading.value = false
    }
  }

  return {
    items,
    loading,
    selectedIds,
    selectedItems,
    selectedCount,
    selectedAmount,
    isAllSelected,
    totalCount,
    totalAmount,
    kitItems,
    productItems,
    fetchCart,
    addItem,
    updateQuantity,
    removeItem,
    removeSelected,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    clearCart,
  }
})
