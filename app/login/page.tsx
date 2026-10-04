"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Input from "@/components/Input";
import PrimaryButton from "@/components/PrimaryButton";
import { supabase } from "@/lib/supabase/client";
import styles from "../auth.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/app");
    router.refresh();
  }

  return (
    <>
      <Header variant="marketing" />
      <main className={styles.wrap}>
        <div className={styles.glow} aria-hidden="true" />
        <div className={styles.card}>
          <span className={`eyebrow ${styles.eyebrow}`}>Welcome back</span>
          <h1 className={styles.title}>Log in to Closetly</h1>
          <p className={styles.subtitle}>
            Your closet is exactly how you left it.
          </p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <div className={styles.submit}>
              <PrimaryButton type="submit" fullWidth>
                Log in
              </PrimaryButton>
            </div>
          </form>

          <p className={styles.footerText}>
            Don&apos;t have a closet yet?{" "}
            <Link href="/signup">Create an account</Link>
          </p>
        </div>
      </main>
    </>
  );
}
