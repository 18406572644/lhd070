<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/utils/api'

const props = defineProps<{
  modelValue: string[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

const images = computed({
  get: () => props.modelValue,
  set: (val: string[]) => emit('update:modelValue', val),
})

function triggerUpload() {
  fileInputRef.value?.click()
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  uploading.value = true
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const formData = new FormData()
      formData.append('file', file)
      try {
        const res = await api.post('/upload', formData)
        if (res.data?.success && res.data?.data?.url) {
          images.value = [...images.value, res.data.data.url]
        } else {
          ElMessage.error(res.data?.error || '上传失败')
        }
      } catch (err: any) {
        const msg = err.response?.data?.error || err.message || '上传失败'
        ElMessage.error(msg)
      }
    }
  } finally {
    uploading.value = false
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}

function removeImage(index: number) {
  const next = [...images.value]
  next.splice(index, 1)
  images.value = next
}

function onDragStart(index: number, e: DragEvent) {
  dragIndex.value = index
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
  }
}

function onDragOver(index: number, e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
  }
  dragOverIndex.value = index
}

function onDragLeave() {
  dragOverIndex.value = null
}

function onDrop(targetIndex: number, e: DragEvent) {
  e.preventDefault()
  if (dragIndex.value === null || dragIndex.value === targetIndex) {
    dragIndex.value = null
    dragOverIndex.value = null
    return
  }
  const next = [...images.value]
  const [removed] = next.splice(dragIndex.value, 1)
  next.splice(targetIndex, 0, removed)
  images.value = next
  dragIndex.value = null
  dragOverIndex.value = null
}

function onDragEnd() {
  dragIndex.value = null
  dragOverIndex.value = null
}

function previewImage(url: string) {
  window.open(url, '_blank')
}
</script>

<template>
  <div class="image-uploader">
    <div class="image-list">
      <div
        v-for="(url, idx) in images"
        :key="idx"
        class="image-item"
        :class="{ 'is-drag-over': dragOverIndex === idx }"
        draggable="true"
        @dragstart="onDragStart(idx, $event)"
        @dragover="onDragOver(idx, $event)"
        @dragleave="onDragLeave"
        @drop="onDrop(idx, $event)"
        @dragend="onDragEnd"
      >
        <img :src="url" class="image-preview" @click="previewImage(url)" />
        <div class="image-actions">
          <span class="image-index">{{ idx + 1 }}</span>
          <button type="button" class="image-remove" @click="removeImage(idx)" title="删除">
            ×
          </button>
        </div>
      </div>
      <div
        v-if="images.length < 9"
        class="image-add-btn"
        @click="triggerUpload"
        :class="{ disabled: uploading }"
      >
        <div v-if="uploading" class="uploading-spinner"></div>
        <template v-else>
          <span class="plus-icon">+</span>
          <span class="add-text">上传图片</span>
        </template>
      </div>
    </div>
    <input
      ref="fileInputRef"
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      multiple
      hidden
      @change="handleFileChange"
    />
    <div class="upload-hint">支持 jpg/jpeg/png/gif/webp，单张 ≤ 5MB，最多 9 张，可拖拽排序</div>
  </div>
</template>

<style scoped>
.image-uploader {
  width: 100%;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.image-item {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--cc-border);
  background-color: var(--cc-card);
  cursor: move;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.image-item:hover {
  border-color: var(--cc-cyan-dim);
}

.image-item.is-drag-over {
  border-color: var(--cc-cyan);
  box-shadow: 0 0 0 2px var(--cc-cyan-glow);
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
}

.image-actions {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 4px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.5), transparent 40%);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.image-item:hover .image-actions {
  opacity: 1;
}

.image-index {
  background-color: var(--cc-cyan);
  color: var(--cc-dark);
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 10px;
  line-height: 1.4;
}

.image-remove {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background-color: var(--cc-danger);
  color: #fff;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease;
}

.image-remove:hover {
  transform: scale(1.1);
}

.image-add-btn {
  width: 96px;
  height: 96px;
  border-radius: 6px;
  border: 1px dashed var(--cc-border);
  background-color: var(--cc-card);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--cc-text-dim);
}

.image-add-btn:hover {
  border-color: var(--cc-cyan-dim);
  color: var(--cc-cyan);
}

.image-add-btn.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.plus-icon {
  font-size: 28px;
  line-height: 1;
  font-weight: 300;
}

.add-text {
  font-size: 12px;
}

.uploading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--cc-border);
  border-top-color: var(--cc-cyan);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.upload-hint {
  margin-top: 0.5rem;
  font-size: 12px;
  color: var(--cc-text-dim);
}
</style>
