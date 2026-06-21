<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const cartStore = useCartStore()

function getSubtotal(item: any): number {
  return item.product.price * item.quantity
}

function handleQuantityChange(id: number | string, quantity: number) {
  if (quantity < 1) return
  cartStore.updateQuantity(id, quantity)
}

async function handleRemove(id: number | string) {
  try {
    await cartStore.removeItem(id)
  } catch {
    //
  }
}

async function handleClear() {
  try {
    await ElMessageBox.confirm('确认清空购物车吗？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await cartStore.clearCart()
    ElMessage.success('已清空购物车')
  } catch {
    //
  }
}

onMounted(() => {
  cartStore.fetchCart()
})
</script>

<template>
  <div class="cart-page">
    <h2 class="page-title">购物车</h2>

    <div v-if="cartStore.loading" class="loading-state">
      <el-icon class="is-loading" :size="32"><svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 64a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V96a32 32 0 0 1 32-32zm0 640a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V736a32 32 0 0 1 32-32zM195.2 195.2a32 32 0 0 1 45.248 0l135.808 135.808a32 32 0 0 1-45.248 45.248L195.2 240.448a32 32 0 0 1 0-45.248zm452.544 452.544a32 32 0 0 1 45.248 0l135.808 135.808a32 32 0 0 1-45.248 45.248L647.744 693.248a32 32 0 0 1 0-45.248zM64 512a32 32 0 0 1 32-32h192a32 32 0 0 1 0 64H96a32 32 0 0 1-32-32zm640 0a32 32 0 0 1 32-32h192a32 32 0 0 1 0 64H736a32 32 0 0 1-32-32zM195.2 828.8a32 32 0 0 1 0-45.248l135.808-135.808a32 32 0 0 1 45.248 45.248L240.448 828.8a32 32 0 0 1-45.248 0zm452.544-452.544a32 32 0 0 1 0-45.248l135.808-135.808a32 32 0 0 1 45.248 45.248L693.248 376.256a32 32 0 0 1-45.248 0z" fill="currentColor"/></svg></el-icon>
    </div>

    <div v-else-if="cartStore.items.length === 0" class="empty-state">
      <div class="empty-content">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--cc-cyan-dim)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="64" height="64">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        <p class="empty-text">购物车是空的</p>
        <router-link to="/products" class="cyber-btn">去逛逛</router-link>
      </div>
    </div>

    <template v-else>
      <div class="cart-table">
        <div class="table-header">
          <span class="col-product">商品</span>
          <span class="col-price">单价</span>
          <span class="col-qty">数量</span>
          <span class="col-subtotal">小计</span>
          <span class="col-action">操作</span>
        </div>
        <div
          v-for="item in cartStore.items"
          :key="item.id"
          class="table-row"
        >
          <div class="col-product">
            <div class="item-image image-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--cc-cyan)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <line x1="8" y1="14" x2="16" y2="14" />
              </svg>
            </div>
            <div class="item-info">
              <span class="item-name">{{ item.product.name }}</span>
              <span class="tag-cyan" v-if="item.product.brand">{{ item.product.brand }}</span>
            </div>
          </div>
          <div class="col-price">¥{{ item.product.price }}</div>
          <div class="col-qty">
            <el-input-number
              :model-value="item.quantity"
              :min="1"
              :max="99"
              size="small"
              @change="(val: number) => handleQuantityChange(item.id, val)"
            />
          </div>
          <div class="col-subtotal subtotal">¥{{ getSubtotal(item) }}</div>
          <div class="col-action">
            <button class="delete-btn" @click="handleRemove(item.id)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="cart-footer">
        <button class="cyber-btn" @click="handleClear">清空购物车</button>
        <div class="cart-total">
          <span class="total-label">合计：</span>
          <span class="total-amount">¥{{ cartStore.totalAmount }}</span>
        </div>
        <router-link to="/checkout" class="cyber-btn-primary checkout-btn">去结算</router-link>
      </div>
    </template>
  </div>
</template>

<style scoped>
.cart-page {
  animation: fadeInUp 0.5s ease;
}

.page-title {
  font-size: 1.75rem;
  margin-bottom: 1.25rem;
}

.cart-table {
  background: var(--cc-card);
  border: 1px solid var(--cc-border);
  border-radius: 0.5rem;
  overflow: hidden;
}

.table-header {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.25rem;
  background: rgba(125, 253, 254, 0.05);
  border-bottom: 1px solid var(--cc-border);
  font-family: 'Rajdhani', sans-serif;
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--cc-text-dim);
}

.table-row {
  display: flex;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--cc-border);
  transition: background 0.2s;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: rgba(125, 253, 254, 0.02);
}

.col-product {
  flex: 2;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.col-price {
  flex: 0.8;
  text-align: center;
  color: var(--cc-text);
  font-size: 0.9rem;
}

.col-qty {
  flex: 0.8;
  display: flex;
  justify-content: center;
}

.col-subtotal {
  flex: 0.8;
  text-align: center;
}

.col-action {
  flex: 0.5;
  display: flex;
  justify-content: center;
}

.item-image {
  width: 64px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 4px;
}

.image-placeholder {
  background: linear-gradient(135deg, rgba(125, 253, 254, 0.08), rgba(125, 253, 254, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.item-name {
  font-size: 0.9rem;
  color: var(--cc-white);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.subtotal {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  color: var(--cc-cyan);
}

.delete-btn {
  background: none;
  border: none;
  color: var(--cc-text-dim);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn:hover {
  color: var(--cc-danger);
  background: rgba(255, 107, 107, 0.1);
}

.cart-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 1.5rem;
  padding: 1.25rem;
  background: var(--cc-card);
  border: 1px solid var(--cc-border);
  border-radius: 0.5rem;
}

.cart-total {
  flex: 1;
  text-align: right;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.total-label {
  font-size: 1rem;
  color: var(--cc-text);
}

.total-amount {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--cc-cyan);
  text-shadow: 0 0 10px var(--cc-cyan-glow);
}

.checkout-btn {
  text-decoration: none;
  padding: 0.6rem 2rem;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.empty-text {
  font-size: 1.1rem;
  color: var(--cc-text-dim);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: var(--cc-text-dim);
}

@media (max-width: 768px) {
  .table-header {
    display: none;
  }
  .table-row {
    flex-wrap: wrap;
    gap: 8px;
  }
  .col-product {
    flex: 1 1 100%;
  }
  .col-price,
  .col-qty,
  .col-subtotal,
  .col-action {
    flex: 1;
    justify-content: center;
    text-align: center;
  }
}
</style>
