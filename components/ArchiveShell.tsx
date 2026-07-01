"use client";

import { useEffect, useState } from "react";
import Gallery from "./Gallery";
import UploadButton from "./UploadButton";
import AdminLogin from "./AdminLogin";
import { supabase } from "../lib/supabase";

export default function ArchiveShell() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getSession();
      setIsAdmin(!!data.session);
    }

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <main className="min-h-screen bg-white px-4 py-5 text-neutral-950 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex items-center justify-between border-b border-neutral-200 pb-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-red-600 md:text-2xl">
              yunus archive
            </h1>
            <p className="mt-1 text-xs text-neutral-500">visual archive</p>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && <UploadButton />}
            <AdminLogin isAdmin={isAdmin} />
          </div>
        </header>

        <Gallery isAdmin={isAdmin} />
      </div>
    </main>
  );
}