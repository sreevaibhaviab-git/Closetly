import styles from "./ClothingCard.module.css";

type ClothingCardProps = {
  name: string;
  category: string;
  color?: string | null;
  imageUrl?: string | null;
  isFavorite?: boolean;
  isInLaundry?: boolean;
  isUpdating?: boolean;
  onFavorite?: () => void;
  onLaundry?: () => void;
  onDelete?: () => void;
};

export default function ClothingCard({
  name,
  category,
  color = "var(--cream)",
  imageUrl,
  isFavorite = false,
  isInLaundry = false,
  isUpdating = false,
  onFavorite,
  onLaundry,
  onDelete,
}: ClothingCardProps) {
  return (
    <article
      className={styles.card}
      style={{
        position: "relative",
        opacity: isInLaundry ? 0.72 : 1,
      }}
    >
      <div
        className={styles.thumb}
        style={{
          background: color || "var(--cream)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          category
        )}

        {isInLaundry && (
          <span
            style={{
              position: "absolute",
              left: "12px",
              bottom: "12px",
              padding: "6px 11px",
              borderRadius: "999px",
              background: "rgba(255, 252, 249, 0.92)",
              color: "var(--ink)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.03em",
              backdropFilter: "blur(8px)",
            }}
          >
            In laundry
          </span>
        )}
      </div>

      <div className={styles.body}>
        <p className={styles.name}>{name}</p>

        <p className={styles.category}>
          {category}
          {color ? ` · ${color}` : ""}
        </p>

        {(onFavorite || onLaundry || onDelete) && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "8px",
              marginTop: "16px",
            }}
          >
            {onFavorite && (
              <button
                type="button"
                onClick={onFavorite}
                disabled={isUpdating}
                aria-label={
                  isFavorite
                    ? `Remove ${name} from favourites`
                    : `Add ${name} to favourites`
                }
                title={isFavorite ? "Remove favourite" : "Favourite"}
                style={actionButtonStyle}
              >
                {isFavorite ? "♥" : "♡"}
              </button>
            )}

            {onLaundry && (
              <button
                type="button"
                onClick={onLaundry}
                disabled={isUpdating}
                aria-label={
                  isInLaundry
                    ? `Mark ${name} as available`
                    : `Mark ${name} as in laundry`
                }
                title={isInLaundry ? "Mark available" : "Send to laundry"}
                style={actionButtonStyle}
              >
                {isInLaundry ? "✓" : "Laundry"}
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                disabled={isUpdating}
                aria-label={`Delete ${name}`}
                title="Delete item"
                style={{
                  ...actionButtonStyle,
                  color: "var(--rose-deep)",
                }}
              >
                Delete
              </button>
            )}
          </div>
        )}

        {isUpdating && (
          <p
            role="status"
            style={{
              marginTop: "10px",
              color: "var(--ink-soft)",
              fontSize: "12px",
            }}
          >
            Updating...
          </p>
        )}
      </div>
    </article>
  );
}

const actionButtonStyle: React.CSSProperties = {
  minHeight: "36px",
  padding: "7px 8px",
  border: "1px solid var(--line)",
  borderRadius: "999px",
  background: "var(--paper)",
  color: "var(--ink)",
  fontFamily: "inherit",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
};