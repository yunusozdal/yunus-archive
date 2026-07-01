"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

type AdminLoginProps = {
  isAdmin: boolean;
};

export default function AdminLogin({ isAdmin }: AdminLoginProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setOpen(false);
    window.location.reload();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  if (isAdmin) {
    return (
      <button
        onClick={handleLogout}
        className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
      >
        Logout
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-red-400 hover:text-red-600"
      >
        Admin
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-neutral-200 bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-950">
                Admin login
              </h2>

              <button
                onClick={() => setOpen(false)}
                className="rounded-full bg-neutral-100 px-3 py-2 text-sm text-red-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-red-500"
              />

              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                type="password"
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-red-500"
              />

              <button
                onClick={handleLogin}
                className="w-full rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}