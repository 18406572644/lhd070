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

  const totalCount = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
  const totalAmount = computed(() =>
    items.value.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  )
  const kitItems = computed(() => items.value.filter((item) => item.type === 'kit'))
  const productItems = computed(() => items.value.filter((item) => item.type === 'product'))

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

  function mapItem(raw: RawCartItem): CartItem {
    return {
      id: raw.id,
      productId: raw.productId,
      quantity: raw.quantity,
      type: raw.type,
      product: {
        id: raw.productId,
        name: raw.name,
        price: raw.price,
        images: parseImages(raw.images),
        stock: raw.stock,
        category: raw.categoryName,
        brand: raw.brand,
      },
    }
  }

  async function fetchCart() {
    loading.value = true
    try {
      const data = await get<{ items: RawCartItem[] }>('/cart')
      items.value = data.items.map(mapItem)
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
      await put(`/cart/items/${id}`, { quantity })
      await fetchCart()
    } finally {
      loading.value = false
    }
  }

  async function removeItem(id: number | string) {
    loading.value = true
    try {
      await del(`/cart/items/${id}`)
      await fetchCart()
    } finally {
      loading.value = false
    }
  }

  async function clearCart() {
    loading.value = true
    try {
      await del('/cart')
      await fetchCart()
    } finally {
      loading.value = false
    }
  }

  return {
    items,
    loading,
    totalCount,
    totalAmount,
    kitItems,
    productItems,
    fetchCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  }
})
