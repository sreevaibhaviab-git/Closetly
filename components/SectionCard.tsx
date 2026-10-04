import styles from "./SectionCard.module.css";

type SectionCardProps = {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
};

export default function SectionCard({
  title,
  subtitle,
  children,
  className,
}: SectionCardProps) {
  return (
    <div className={`${styles.card} ${className ?? ""}`}>
      {title && <h3 className={styles.title}>{title}</h3>}
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      {children}
    </div>
  );
}
