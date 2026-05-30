import type { ReactNode } from 'react'
import styles from './Page.module.scss'

type PageProps = {
  title: string
  description?: string
  actions?: ReactNode
  children?: ReactNode
}

/** Reusable page wrapper — title, optional actions slot, content area. */
export function Page({ title, description, actions, children }: PageProps) {
  return (
    <section className={styles.root}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{title}</h1>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </header>
      {children && <div className={styles.content}>{children}</div>}
    </section>
  )
}
