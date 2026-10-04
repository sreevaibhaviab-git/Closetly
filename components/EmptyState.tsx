import styles from "./EmptyState.module.css";

type EmptyStateProps = {
  glyph?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export default function EmptyState({
  glyph = "＋",
  title,
  subtitle,
  action,
}: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <div className={styles.icon} aria-hidden="true">
        {glyph}
      </div>
      <h3 className={styles.title}>{title}</h3>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
