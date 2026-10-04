"use client";


import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Input from "@/components/Input";
import PrimaryButton from "@/components/PrimaryButton";
import styles from "../auth.module.css";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

 async function handleSubmit(event: React.FormEvent) {
   event.preventDefault();

   if (password !== confirmPassword) {
     alert("Passwords do not match.");
     return;
   }

   const { error } = await supabase.auth.signUp({
     email,
     password,
     options: {
       data: {
         name,
       },
     },
   });

   if (error) {
     alert(error.message);
     return;
   }

   alert("Account created. Check your email to confirm your account.");
   router.push("/login");
 }

  return (
    <>
      <Header variant="marketing" />
      <main className={styles.wrap}>
        <div className={styles.glow} aria-hidden="true" />
        <div className={styles.card}>
          <span className={`eyebrow ${styles.eyebrow}`}>Start your closet</span>
          <h1 className={styles.title}>Create your account</h1>
          <p className={styles.subtitle}>
            Two minutes, and your closet finally has a brain.
          </p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <Input
              id="name"
              label="Name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
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
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <Input
              id="confirmPassword"
              label="Confirm password"
              type="password"
              placeholder="Type it again"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <div className={styles.submit}>
              <PrimaryButton type="submit" fullWidth>
                Create account
              </PrimaryButton>
            </div>
          </form>

          <p className={styles.footerText}>
            Already have an account? <Link href="/login">Log in</Link>
          </p>
        </div>
      </main>
    </>
  );
}
