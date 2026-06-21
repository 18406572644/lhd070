export interface KeyDef {
  label: string
  subLabel?: string
  width: number
  x: number
  y: number
  row: number
}

export interface LayoutDef {
  name: string
  slug: string
  cols: number
  rows: number
  keys: KeyDef[]
}

const U = 1

function layout60(): LayoutDef {
  const keys: KeyDef[] = []
  let row = 0
  let x = 0

  const row1 = ['Esc', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace']
  const row1Widths = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2]
  x = 0
  row1.forEach((label, i) => {
    keys.push({ label, width: row1Widths[i], x, y: row, row })
    x += row1Widths[i]
  })

  row = 1
  const row2 = ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\']
  const row2Widths = [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5]
  x = 0
  row2.forEach((label, i) => {
    keys.push({ label, width: row2Widths[i], x, y: row, row })
    x += row2Widths[i]
  })

  row = 2
  const row3 = ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Enter']
  const row3Widths = [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25]
  x = 0
  row3.forEach((label, i) => {
    keys.push({ label, width: row3Widths[i], x, y: row, row })
    x += row3Widths[i]
  })

  row = 3
  const row4 = ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'RShift']
  const row4Widths = [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75]
  x = 0
  row4.forEach((label, i) => {
    keys.push({ label, width: row4Widths[i], x, y: row, row })
    x += row4Widths[i]
  })

  row = 4
  const row5 = ['Ctrl', 'Win', 'Alt', 'Space', 'RAlt', 'Fn', 'RCtrl']
  const row5Widths = [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25]
  x = 0
  row5.forEach((label, i) => {
    keys.push({ label, width: row5Widths[i], x, y: row, row })
    x += row5Widths[i]
  })

  return {
    name: '60%',
    slug: '60',
    cols: 14,
    rows: 5,
    keys,
  }
}

function layout65(): LayoutDef {
  const keys: KeyDef[] = []
  let row = 0
  let x = 0

  const row1 = ['Esc', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace', 'Del']
  const row1Widths = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1]
  x = 0
  row1.forEach((label, i) => {
    keys.push({ label, width: row1Widths[i], x, y: row, row })
    x += row1Widths[i]
  })

  row = 1
  const row2 = ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\', 'PgUp']
  const row2Widths = [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5, 1]
  x = 0
  row2.forEach((label, i) => {
    keys.push({ label, width: row2Widths[i], x, y: row, row })
    x += row2Widths[i]
  })

  row = 2
  const row3 = ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Enter', 'PgDn']
  const row3Widths = [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25, 1]
  x = 0
  row3.forEach((label, i) => {
    keys.push({ label, width: row3Widths[i], x, y: row, row })
    x += row3Widths[i]
  })

  row = 3
  const row4 = ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'RShift', '↑', 'End']
  const row4Widths = [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.75, 1, 1]
  x = 0
  row4.forEach((label, i) => {
    keys.push({ label, width: row4Widths[i], x, y: row, row })
    x += row4Widths[i]
  })

  row = 4
  const row5 = ['Ctrl', 'Win', 'Alt', 'Space', 'RAlt', 'Fn', '←', '↓', '→']
  const row5Widths = [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1, 1, 1]
  x = 0
  row5.forEach((label, i) => {
    keys.push({ label, width: row5Widths[i], x, y: row, row })
    x += row5Widths[i]
  })

  return {
    name: '65%',
    slug: '65',
    cols: 15,
    rows: 5,
    keys,
  }
}

function layout75(): LayoutDef {
  const keys: KeyDef[] = []
  let row = 0
  let x = 0

  const row0 = ['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'Del', 'Home']
  const row0Widths = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  x = 0
  row0.forEach((label, i) => {
    keys.push({ label, width: row0Widths[i], x, y: row, row })
    x += row0Widths[i]
  })

  row = 1
  const row1 = ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace', 'PgUp']
  const row1Widths = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1]
  x = 0
  row1.forEach((label, i) => {
    keys.push({ label, width: row1Widths[i], x, y: row, row })
    x += row1Widths[i]
  })

  row = 2
  const row2 = ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\', 'PgDn']
  const row2Widths = [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5, 1]
  x = 0
  row2.forEach((label, i) => {
    keys.push({ label, width: row2Widths[i], x, y: row, row })
    x += row2Widths[i]
  })

  row = 3
  const row3 = ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Enter', 'End']
  const row3Widths = [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25, 1]
  x = 0
  row3.forEach((label, i) => {
    keys.push({ label, width: row3Widths[i], x, y: row, row })
    x += row3Widths[i]
  })

  row = 4
  const row4 = ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'RShift', '↑']
  const row4Widths = [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.75, 1]
  x = 0
  row4.forEach((label, i) => {
    keys.push({ label, width: row4Widths[i], x, y: row, row })
    x += row4Widths[i]
  })

  row = 5
  const row5 = ['Ctrl', 'Win', 'Alt', 'Space', 'RAlt', 'Fn', 'RCtrl', '←', '↓', '→']
  const row5Widths = [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1, 1, 1]
  x = 0
  row5.forEach((label, i) => {
    keys.push({ label, width: row5Widths[i], x, y: row, row })
    x += row5Widths[i]
  })

  return {
    name: '75%',
    slug: '75',
    cols: 15,
    rows: 6,
    keys,
  }
}

export const layouts: Record<string, LayoutDef> = {
  '60': layout60(),
  '65': layout65(),
  '75': layout75(),
}

export function getLayout(layoutSlug: string): LayoutDef {
  return layouts[layoutSlug] || layouts['65']
}

export function detectLayoutFromName(name: string): string {
  if (name.includes('60')) return '60'
  if (name.includes('75')) return '75'
  if (name.includes('65')) return '65'
  return '65'
}

export { U }
