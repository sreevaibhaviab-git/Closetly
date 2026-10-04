import Header from "@/components/Header";
import AppSidebar from "@/components/AppSidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import styles from "./layout.module.css";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <AppSidebar />
      <div className={styles.main}>
        <Header variant="app" />
        <main className={styles.content}>{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
