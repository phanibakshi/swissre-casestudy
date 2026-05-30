function getRootFontSizePx(): number {
  const size = parseFloat(getComputedStyle(document.documentElement).fontSize)
  return Number.isFinite(size) && size > 0 ? size : 16
}

export function remToPx(rem: number): number {
  return rem * getRootFontSizePx()
}

export function pxToRem(px: number): number {
  return px / getRootFontSizePx()
}

export function getTableRowHeightPx(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--table-row-height').trim()
  const rem = parseFloat(raw)
  return remToPx(Number.isFinite(rem) ? rem : 3.0625)
}
