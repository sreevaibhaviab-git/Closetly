import fieldStyles from "./Input.module.css";
import styles from "./Select.module.css";

type SelectProps = {
  label: string;
  id: string;
  options: string[];
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
};

export default function Select({
  label,
  id,
  options,
  value,
  onChange,
}: SelectProps) {
  return (
    <div className={fieldStyles.field}>
      <label htmlFor={id} className={fieldStyles.label}>
        {label}
      </label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        className={styles.select}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
