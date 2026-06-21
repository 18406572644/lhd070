<script setup lang="ts">
import { computed } from 'vue'
import { getLayout, detectLayoutFromName, type LayoutDef, type KeyDef } from '@/lib/keyboardLayouts'
import {
  getKeycapColors,
  getCaseColors,
  getCableColors,
  getSwitchColors,
  isModifierKey,
  isAccentKey,
  type ColorScheme,
  type CaseColors,
  type CableColors,
  type SwitchColors,
} from '@/lib/colorMappings'
import { parseParams } from '@/stores/products'
import type { Product } from '@/stores/products'

interface Props {
  selectedCase?: Product | null
  selectedKeycap?: Product | null
  selectedSwitch?: Product | null
  selectedCable?: Product | null
}

const props = withDefaults(defineProps<Props>(), {
  selectedCase: null,
  selectedKeycap: null,
  selectedSwitch: null,
  selectedCable: null,
})

const KEY_SIZE = 28
const KEY_GAP = 2
const CASE_PADDING = 14
const CORNER_RADIUS = 8

const layout = computed<LayoutDef>(() => {
  if (props.selectedCase) {
    const params = parseParams(props.selectedCase.params as Record<string, string>)
    const pailie = params['配列'] || ''
    if (pailie.includes('60')) return getLayout('60')
    if (pailie.includes('75')) return getLayout('75')
    if (pailie.includes('65')) return getLayout('65')
    const detected = detectLayoutFromName(props.selectedCase.name)
    return getLayout(detected)
  }
  return getLayout('65')
})

const caseParams = computed(() =>
  props.selectedCase ? parseParams(props.selectedCase.params as Record<string, string>) : {}
)
const keycapParams = computed(() =>
  props.selectedKeycap ? parseParams(props.selectedKeycap.params as Record<string, string>) : {}
)
const switchParams = computed(() =>
  props.selectedSwitch ? parseParams(props.selectedSwitch.params as Record<string, string>) : {}
)
const cableParams = computed(() =>
  props.selectedCable ? parseParams(props.selectedCable.params as Record<string, string>) : {}
)

const caseColors = computed<CaseColors>(() =>
  props.selectedCase
    ? getCaseColors(props.selectedCase.name, caseParams.value)
    : getCaseColors('默认')
)

const keycapColors = computed<ColorScheme>(() =>
  props.selectedKeycap
    ? getKeycapColors(props.selectedKeycap.name, keycapParams.value)
    : getKeycapColors('默认')
)

const cableColors = computed<CableColors>(() =>
  props.selectedCable
    ? getCableColors(props.selectedCable.name, cableParams.value)
    : getCableColors('默认')
)

const switchColors = computed<SwitchColors>(() =>
  props.selectedSwitch
    ? getSwitchColors(props.selectedSwitch.name, switchParams.value)
    : getSwitchColors('默认')
)

const switchLabel = computed(() => {
  if (!props.selectedSwitch) return null
  const params = switchParams.value
  const type = params['type'] || params['轴类型'] || ''
  const brand = props.selectedSwitch.brand
  if (brand && type) return `${brand} ${type}`
  return brand || props.selectedSwitch.name
})

const totalWidth = computed(() => {
  const maxX = Math.max(...layout.value.keys.map((k) => k.x + k.width))
  return maxX * (KEY_SIZE + KEY_GAP) + CASE_PADDING * 2
})

const totalHeight = computed(() => {
  return layout.value.rows * (KEY_SIZE + KEY_GAP) + CASE_PADDING * 2 + 40
})

function getKeyX(key: KeyDef): number {
  return CASE_PADDING + key.x * (KEY_SIZE + KEY_GAP)
}

function getKeyY(key: KeyDef): number {
  return CASE_PADDING + key.y * (KEY_SIZE + KEY_GAP) + 10
}

function getKeyWidth(key: KeyDef): number {
  return key.width * KEY_SIZE + (key.width - 1) * KEY_GAP
}

function getKeyFill(key: KeyDef): string {
  if (isAccentKey(key.label)) return keycapColors.value.accents
  if (isModifierKey(key.label)) return keycapColors.value.modifiers
  return keycapColors.value.base
}

function getLegendFill(key: KeyDef): string {
  if (isAccentKey(key.label)) {
    const scheme = keycapColors.value
    return scheme.accents === '#7DFDFE' || scheme.accents === '#E74C3C' || scheme.accents === '#C0392B'
      ? '#F0F2F5'
      : '#1A1A1A'
  }
  if (isModifierKey(key.label)) return keycapColors.value.legendsSecondary
  return keycapColors.value.legends
}

function getLegendFontSize(key: KeyDef): number {
  const label = key.label
  if (label.length <= 1) return 11
  if (label.length <= 3) return 9
  if (label.length <= 6) return 7.5
  return 6
}

function getLegendYOffset(key: KeyDef): number {
  const label = key.label
  if (label.length <= 1) return 4
  return 3
}

const svgViewBox = computed(() => `0 0 ${totalWidth.value} ${totalHeight.value}`)
</script>

<template>
  <div class="keyboard-preview">
    <svg
      :viewBox="svgViewBox"
      class="keyboard-svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="caseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" :stop-color="caseColors.frameLight" />
          <stop offset="50%" :stop-color="caseColors.frame" />
          <stop offset="100%" :stop-color="caseColors.frameDark" />
        </linearGradient>
        <linearGradient id="innerShadow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="rgba(0,0,0,0.3)" />
          <stop offset="15%" stop-color="rgba(0,0,0,0)" />
        </linearGradient>
        <linearGradient id="cableGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" :stop-color="cableColors.accent" />
          <stop offset="50%" :stop-color="cableColors.main" />
          <stop offset="100%" :stop-color="cableColors.accent" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="keyShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.4" />
        </filter>
      </defs>

      <path
        v-if="selectedCable"
        :d="`M ${totalWidth / 2 - 30} ${totalHeight - 10}
            C ${totalWidth / 2 - 30} ${totalHeight + 20},
              ${totalWidth / 2 + 30} ${totalHeight + 20},
              ${totalWidth / 2 + 30} ${totalHeight + 60}
            L ${totalWidth / 2 + 30} ${totalHeight + 90}
            Q ${totalWidth / 2 + 30} ${totalHeight + 100},
              ${totalWidth / 2 + 40} ${totalHeight + 100}
            L ${totalWidth / 2 + 80} ${totalHeight + 100}`"
        fill="none"
        stroke="url(#cableGradient)"
        stroke-width="5"
        stroke-linecap="round"
      />
      <path
        v-if="selectedCable"
        :d="`M ${totalWidth / 2 - 30} ${totalHeight - 10}
            C ${totalWidth / 2 - 30} ${totalHeight + 20},
              ${totalWidth / 2 + 30} ${totalHeight + 20},
              ${totalWidth / 2 + 30} ${totalHeight + 60}
            L ${totalWidth / 2 + 30} ${totalHeight + 90}
            Q ${totalWidth / 2 + 30} ${totalHeight + 100},
              ${totalWidth / 2 + 40} ${totalHeight + 100}
            L ${totalWidth / 2 + 80} ${totalHeight + 100}`"
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        stroke-width="3"
        stroke-linecap="round"
      />
      <rect
        v-if="selectedCable"
        :x="totalWidth / 2 + 80"
        :y="totalHeight + 92"
        width="24"
        height="16"
        rx="3"
        :fill="cableColors.connector"
        stroke="rgba(255,255,255,0.2)"
        stroke-width="1"
      />
      <rect
        v-if="selectedCable"
        :x="totalWidth / 2 + 84"
        :y="totalHeight + 96"
        width="12"
        height="8"
        rx="1.5"
        fill="#1A1D23"
      />
      <path
        v-if="selectedCable"
        :d="`M ${totalWidth / 2 + 100} ${totalHeight + 98}
            L ${totalWidth / 2 + 104} ${totalHeight + 98}
            M ${totalWidth / 2 + 100} ${totalHeight + 102}
            L ${totalWidth / 2 + 104} ${totalHeight + 102}`"
        stroke="#C8CCD4"
        stroke-width="0.8"
        stroke-linecap="round"
      />

      <rect
        x="2"
        y="2"
        :width="totalWidth - 4"
        :height="totalHeight - 4 - 20"
        :rx="CORNER_RADIUS + 2"
        fill="none"
        stroke="rgba(125, 253, 254, 0.15)"
        stroke-width="1"
      />

      <rect
        x="4"
        y="4"
        :width="totalWidth - 8"
        :height="totalHeight - 8 - 20"
        :rx="CORNER_RADIUS"
        fill="url(#caseGradient)"
        filter="url(#glow)"
      />

      <rect
        :x="CASE_PADDING - 4"
        :y="CASE_PADDING + 6"
        :width="totalWidth - (CASE_PADDING - 4) * 2"
        :height="layout.rows * (KEY_SIZE + KEY_GAP) - KEY_GAP + 4"
        rx="4"
        :fill="caseColors.inner"
      />
      <rect
        :x="CASE_PADDING - 4"
        :y="CASE_PADDING + 6"
        :width="totalWidth - (CASE_PADDING - 4) * 2"
        :height="layout.rows * (KEY_SIZE + KEY_GAP) - KEY_GAP + 4"
        rx="4"
        fill="url(#innerShadow)"
      />

      <g>
        <g v-for="(key, idx) in layout.keys" :key="idx" :transform="`translate(${getKeyX(key)}, ${getKeyY(key)})`">
          <rect
            v-if="selectedSwitch"
            x="2"
            y="2"
            :width="getKeyWidth(key) - 4"
            :height="KEY_SIZE - 4"
            rx="3"
            :fill="switchColors.housingBottom"
            opacity="0.8"
          />
          <rect
            v-if="selectedSwitch"
            :x="getKeyWidth(key) / 2 - 4"
            :y="KEY_SIZE / 2 - 4"
            width="8"
            height="8"
            rx="1.5"
            :fill="switchColors.stem"
          />
          <rect
            x="0"
            y="0"
            :width="getKeyWidth(key)"
            :height="KEY_SIZE"
            :rx="3"
            :fill="getKeyFill(key)"
            filter="url(#keyShadow)"
            stroke="rgba(0,0,0,0.2)"
            stroke-width="0.5"
          />
          <rect
            x="1"
            y="1"
            :width="getKeyWidth(key) - 2"
            :height="KEY_SIZE - 18"
            rx="2"
            fill="rgba(255,255,255,0.04)"
          />
          <text
            :x="getKeyWidth(key) / 2"
            :y="KEY_SIZE / 2 + getLegendYOffset(key)"
            text-anchor="middle"
            dominant-baseline="middle"
            :fill="getLegendFill(key)"
            :font-size="getLegendFontSize(key)"
            font-family="'Rajdhani', 'Noto Sans SC', sans-serif"
            font-weight="600"
          >
            {{ key.label }}
          </text>
        </g>
      </g>

      <g v-if="switchLabel">
        <rect
          :x="CASE_PADDING"
          :y="totalHeight - 28"
          :width="Math.max(120, switchLabel.length * 8 + 24)"
          height="20"
          rx="4"
          :fill="switchColors.stem"
          opacity="0.9"
        />
        <text
          :x="CASE_PADDING + Math.max(120, switchLabel.length * 8 + 24) / 2"
          :y="totalHeight - 18"
          text-anchor="middle"
          dominant-baseline="middle"
          fill="#1A1D23"
          font-size="10"
          font-family="'Rajdhani', sans-serif"
          font-weight="700"
        >
          {{ switchLabel }}
        </text>
      </g>

      <text
        :x="totalWidth - CASE_PADDING"
        :y="totalHeight - 16"
        text-anchor="end"
        dominant-baseline="middle"
        fill="var(--cc-cyan)"
        opacity="0.6"
        font-size="11"
        font-family="'Rajdhani', sans-serif"
        font-weight="700"
      >
        {{ layout.name }} LAYOUT
      </text>
    </svg>
  </div>
</template>

<style scoped>
.keyboard-preview {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, rgba(125, 253, 254, 0.03), rgba(125, 253, 254, 0.08));
  border: 1px solid var(--cc-border);
  border-radius: 8px;
  margin-bottom: 16px;
}

.keyboard-svg {
  width: 100%;
  height: auto;
  display: block;
}
</style>
