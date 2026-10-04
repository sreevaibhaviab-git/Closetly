import styles from "./PageHeader.module.css";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: PageHeaderProps) {
  return (
    <div className={styles.header}>
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
