import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.scss'

type Variant = 'primary' | 'secondary' | 'ghost'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  children: ReactNode
}

const variantClass: Record<Variant, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  ghost: styles.ghost,
}

export function Button({ variant = 'secondary', className, children, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={[styles.button, variantClass[variant], className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
