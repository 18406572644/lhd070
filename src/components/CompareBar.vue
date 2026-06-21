<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useCompareStore } from '@/stores/compare'

const router = useRouter()
const compareStore = useCompareStore()

function goCompare() {
  if (compareStore.canCompare) {
    router.push('/compare')
  }
}

function handleRemove(id: number | string) {
  compareStore.removeItem(id)
}
</script>

<template>
  <transition name="compare-bar">
    <div v-if="compareStore.count > 0" class="compare-bar">
      <div class="compare-bar-inner">
        <div class="compare-bar-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span>对比栏</span>
          <span class="compare-category" v-if="compareStore.currentCategoryName">{{ compareStore.currentCategoryName }}</span>
          <span class="compare-count">{{ compareStore.count }}/{{ 4 }}</span>
        </div>

        <div class="compare-items">
          <div v-for="item in compareStore.items" :key="item.id" class="compare-item">
            <div class="compare-item-thumb">
              <svg v-if="item.images.length === 0" viewBox="0 0 24 24" fill="none" stroke="var(--cc-cyan)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <line x1="8" y1="14" x2="16" y2="14" />
              </svg>
              <img v-else :src="item.images[0]" :alt="item.name" />
            </div>
            <span class="compare-item-name">{{ item.name }}</span>
            <button class="compare-item-remove" @click="handleRemove(item.id)" title="移除">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div v-for="n in (4 - compareStore.count)" :key="'empty-' + n" class="compare-item compare-item-empty">
            <div class="compare-item-thumb empty-thumb">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
          </div>
        </div>

        <div class="compare-bar-actions">
          <button class="cyber-btn compare-clear-btn" @click="compareStore.clearAll()">清空</button>
          <button
            class="cyber-btn-primary compare-go-btn"
            :disabled="!compareStore.canCompare"
            @click="goCompare"
          >
            开始对比
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.compare-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;
  background: rgba(13, 19, 33, 0.97);
  border-top: 1px solid rgba(0, 255, 255, 0.25);
  backdrop-filter: blur(12px);
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.4);
}

.compare-bar-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.compare-bar-label {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  color: var(--cc-cyan);
  font-family: 'Rajdhani', sans-serif;
  font-weight: 600;
  font-size: 0.95rem;
}

.compare-bar-label svg {
  width: 18px;
  height: 18px;
}

.compare-category {
  font-size: 0.75rem;
  padding: 2px 8px;
  background: rgba(0, 255, 255, 0.12);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 4px;
  color: var(--cc-cyan);
}

.compare-count {
  font-size: 0.8rem;
  color: var(--cc-text-dim);
}

.compare-items {
  flex: 1;
  display: flex;
  gap: 12px;
  align-items: center;
  overflow-x: auto;
}

.compare-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--cc-card);
  border: 1px solid var(--cc-border);
  border-radius: 6px;
  padding: 6px 10px;
  flex-shrink: 0;
  position: relative;
}

.compare-item-thumb {
  width: 40px;
  height: 30px;
  border-radius: 3px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(125, 253, 254, 0.08), rgba(125, 253, 254, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.compare-item-thumb svg {
  width: 20px;
  height: 20px;
  opacity: 0.5;
}

.compare-item-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.empty-thumb {
  opacity: 0.3;
}

.compare-item-empty {
  border-style: dashed;
  opacity: 0.5;
}

.compare-item-name {
  font-size: 0.8rem;
  color: var(--cc-text);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compare-item-remove {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  color: var(--cc-text-dim);
  transition: color 0.2s;
}

.compare-item-remove:hover {
  color: var(--cc-danger);
}

.compare-item-remove svg {
  width: 14px;
  height: 14px;
}

.compare-bar-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.compare-clear-btn {
  padding: 6px 14px;
  font-size: 0.8rem;
}

.compare-go-btn {
  padding: 6px 18px;
  font-size: 0.8rem;
}

.compare-go-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.compare-bar-enter-active,
.compare-bar-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.compare-bar-enter-from,
.compare-bar-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

@media (max-width: 768px) {
  .compare-bar-inner {
    padding: 10px 12px;
    gap: 10px;
  }
  .compare-bar-label span:not(.compare-category):not(.compare-count) {
    display: none;
  }
  .compare-item-name {
    max-width: 80px;
  }
}
</style>
