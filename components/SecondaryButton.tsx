import Link from "next/link";
import styles from "./Button.module.css";

type BaseProps = {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  small?: boolean;
};

type LinkProps = BaseProps & {
  href: string;
  type?: never;
  onClick?: never;
};

type ButtonProps = BaseProps & {
  href?: undefined;
  type?: "button" | "submit";
  onClick?: () => void;
};

export default function SecondaryButton(props: LinkProps | ButtonProps) {
  const classNames = [
    styles.secondary,
    props.small ? styles.small : "",
    props.fullWidth ? styles.fullWidth : "",
    props.className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classNames}>
        {props.children}
      </Link>
    );
  }

  const { type = "button", onClick, children } = props as ButtonProps;

  return (
    <button type={type} onClick={onClick} className={classNames}>
      {children}
    </button>
  );
}
