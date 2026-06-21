<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { post } from '@/utils/api'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const cartStore = useCartStore()

const formRef = ref<FormInstance>()
const submitting = ref(false)

const shippingForm = ref({
  name: '',
  phone: '',
  address: '',
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入收货人', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  address: [{ required: true, message: '请输入收货地址', trigger: 'blur' }],
}

const displayItems = computed(() => cartStore.selectedItems.length > 0 ? cartStore.selectedItems : cartStore.items)

const orderItems = computed(() =>
  displayItems.value.map((item) => ({
    id: item.id,
    productId: item.productId,
    name: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
    type: item.type,
  })),
)

const displayAmount = computed(() =>
  displayItems.value.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
)

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  const submitItems = cartStore.selectedItems.length > 0 ? cartStore.selectedItems : cartStore.items
  if (submitItems.length === 0) {
    ElMessage.warning('没有可结算的商品')
    return
  }

  submitting.value = true
  try {
    const data = await post<{ id: number | string; orderNo: string; totalAmount: number }>('/orders', {
      items: submitItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        type: item.type,
      })),
      shippingInfo: {
        name: shippingForm.value.name,
        phone: shippingForm.value.phone,
        address: shippingForm.value.address,
      },
    })
    ElMessage.success('订单提交成功')
    await cartStore.fetchCart()
    router.push(`/orders/${data.id}`)
  } catch {
    //
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  cartStore.fetchCart()
})
</script>

<template>
  <div class="checkout-page">
    <h2 class="page-title">结算</h2>

    <div class="checkout-body">
      <div class="shipping-section">
        <h3 class="section-title">收货信息</h3>
        <el-form
          ref="formRef"
          :model="shippingForm"
          :rules="rules"
          label-position="top"
          class="shipping-form"
        >
          <el-form-item label="收货人" prop="name">
            <el-input v-model="shippingForm.name" placeholder="请输入收货人姓名" />
          </el-form-item>
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="shippingForm.phone" placeholder="请输入手机号" />
          </el-form-item>
          <el-form-item label="收货地址" prop="address">
            <el-input
              v-model="shippingForm.address"
              type="textarea"
              :rows="3"
              placeholder="请输入详细收货地址"
            />
          </el-form-item>
        </el-form>
      </div>

      <div class="summary-section">
        <h3 class="section-title">订单摘要</h3>
        <div class="summary-items">
          <div v-if="displayItems.length === 0" class="empty-hint">没有可结算的商品</div>
          <div
            v-for="item in displayItems"
            :key="item.id"
            class="summary-item"
          >
            <div class="item-image image-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--cc-cyan)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <line x1="8" y1="14" x2="16" y2="14" />
              </svg>
            </div>
            <div class="item-detail">
              <span class="item-name">{{ item.product.name }}</span>
              <span class="item-qty">x{{ item.quantity }}</span>
            </div>
            <div class="item-price">¥{{ (item.product.price * item.quantity).toFixed(2) }}</div>
          </div>
        </div>
        <div class="summary-total">
          <span class="total-label">合计</span>
          <span class="total-amount">¥{{ displayAmount.toFixed(2) }}</span>
        </div>
        <button
          class="cyber-btn-primary submit-btn"
          :disabled="submitting || displayItems.length === 0"
          @click="handleSubmit"
        >
          {{ submitting ? '提交中...' : '提交订单' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.checkout-page {
  animation: fadeInUp 0.5s ease;
}

.page-title {
  font-size: 1.75rem;
  margin-bottom: 1.25rem;
}

.checkout-body {
  display: flex;
  gap: 24px;
}

.shipping-section {
  flex: 1;
  min-width: 0;
}

.shipping-form {
  background: var(--cc-card);
  border: 1px solid var(--cc-border);
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.summary-section {
  width: 360px;
  flex-shrink: 0;
}

.summary-items {
  background: var(--cc-card);
  border: 1px solid var(--cc-border);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.empty-hint {
  text-align: center;
  color: var(--cc-text-dim);
  padding: 2rem 0;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--cc-border);
}

.summary-item:last-child {
  border-bottom: none;
}

.item-image {
  width: 48px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 4px;
}

.image-placeholder {
  background: linear-gradient(135deg, rgba(125, 253, 254, 0.08), rgba(125, 253, 254, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-detail {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-name {
  font-size: 0.85rem;
  color: var(--cc-white);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-qty {
  font-size: 0.75rem;
  color: var(--cc-text-dim);
}

.item-price {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--cc-cyan);
  flex-shrink: 0;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--cc-card);
  border: 1px solid var(--cc-border);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
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

.submit-btn {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .checkout-body {
    flex-direction: column;
  }
  .summary-section {
    width: 100%;
  }
}
</style>
