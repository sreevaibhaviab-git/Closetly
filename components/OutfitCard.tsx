import styles from "./OutfitCard.module.css";

type OutfitItem = {
  id: string;
  name: string | null;
  category: string | null;
  color: string | null;
  image_url: string;
};

type OutfitCardProps = {
  title: string;
  tags: string[];
  items: OutfitItem[];
  reason?: string | null;
  stylingTip?: string | null;
  confidence?: number;
  date?: string;
  isDeleting?: boolean;
  onDelete?: () => void;
};

export default function OutfitCard({
  title,
  tags,
  items,
  reason,
  stylingTip,
  confidence = 0,
  date,
  isDeleting = false,
  onDelete,
}: OutfitCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.collage}>
        {items.slice(0, 4).map((item) => (
          <div
            key={item.id}
            className={styles.imageCell}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image_url}
              alt={item.name || "Outfit item"}
              className={styles.image}
            />
          </div>
        ))}

        {items.length === 0 && (
          <div className={styles.emptyPreview}>
            Outfit preview
          </div>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.headingRow}>
          <div>
            <p className={styles.title}>{title}</p>

            {date && (
              <p className={styles.date}>{date}</p>
            )}
          </div>

          {confidence > 0 && (
            <span className={styles.match}>
              {Math.max(
                0,
                Math.min(100, confidence)
              )}
              %
            </span>
          )}
        </div>

        <div className={styles.tags}>
          {tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>

        {reason && (
          <p className={styles.reason}>{reason}</p>
        )}

        {stylingTip && (
          <p className={styles.tip}>
            <strong>Final touch:</strong> {stylingTip}
          </p>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className={styles.deleteButton}
          >
            {isDeleting
              ? "Deleting..."
              : "Delete outfit"}
          </button>
        )}
      </div>
    </article>
  );
}