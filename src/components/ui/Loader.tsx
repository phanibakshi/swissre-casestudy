import styles from './Loader.module.scss'

type LoaderProps = {
  message?: string
}

/** Full-application overlay — reuse for route, grid, and workspace loads. */
export function Loader({ message = 'Loading…' }: LoaderProps) {
  return (
    <div className={styles.overlay} role="status" aria-live="polite" aria-busy="true">
      <div className={styles.content}>
        <div className={styles.spinner} aria-hidden />
        <p className={styles.message}>{message}</p>
      </div>
    </div>
  )
}
