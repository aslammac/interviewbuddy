"use client";
import { useEffect, useRef, useState } from "react";
import { X, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
export default function AuthPanel({
  onClose,
  recovery = false,
}: {
  onClose: () => void;
  recovery?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState(recovery ? "update" : "login");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    try {
      let error;
      if (mode === "signup") {
        ({ error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        }));
        if (!error)
          setMessage("Check your email to confirm your account, then sign in.");
      } else if (mode === "reset") {
        ({ error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        }));
        if (!error)
          setMessage("If this account exists, a recovery email is on its way.");
      } else if (mode === "update") {
        ({ error } = await supabase.auth.updateUser({ password }));
        if (!error) onClose();
      } else {
        ({ error } = await supabase.auth.signInWithPassword({
          email,
          password,
        }));
        if (!error) onClose();
      }
      if (error) setMessage(error.message);
    } catch {
      setMessage("Unable to connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog ref={ref} className="modal auth-modal" onCancel={onClose}>
      <button className="icon close" aria-label="Close login" onClick={onClose}>
        <X />
      </button>
      <div className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</div>
      <h2>
        {mode === "signup"
          ? "Meet your study buddy."
          : mode === "reset"
            ? "Reset your password."
            : mode === "update"
              ? "Choose a new password."
              : "Welcome back."}
      </h2>
      <p className="muted">
        Save your progress. Keep your interviews organized.
      </p>
      <form onSubmit={submit}>
        {mode !== "update" && (
          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
          </label>
        )}
        {mode !== "reset" && (
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              minLength={8}
              required
            />
          </label>
        )}
        <button disabled={busy} className="button primary">
          {busy
            ? "Please wait…"
            : mode === "signup"
              ? "Create account"
              : mode === "reset"
                ? "Send recovery email"
                : mode === "update"
                  ? "Update password"
                  : "Sign in"}
          <ArrowRight size={16} />
        </button>
      </form>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      {process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true" && (
        <button
          className="button full"
          onClick={async () => {
            const { error } = await supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: window.location.origin },
            });
            if (error) setMessage(error.message);
          }}
        >
          Continue with Google
        </button>
      )}
      <div className="auth-links">
        <button
          onClick={() => {
            setMode(mode === "signup" ? "login" : "signup");
            setMessage("");
          }}
        >
          {mode === "signup"
            ? "Already have an account? Sign in"
            : "New here? Create an account"}
        </button>
        <button
          onClick={() => {
            setMode("reset");
            setMessage("");
          }}
        >
          Forgot password?
        </button>
      </div>
    </dialog>
  );
}
