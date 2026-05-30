function getRootFontSizePx(): number {
  const customBase = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--rem-base'))
  if (Number.isFinite(customBase) && customBase > 0) return customBase

  const size = parseFloat(getComputedStyle(document.documentElement).fontSize)
  return Number.isFinite(size) && size > 0 ? size : 14
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
