"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function PortalLoginForm() {
  const router = useRouter();
  const [access, setAccess] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    router.push("/portal/demo");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-6" noValidate>
      <div>
        <label
          htmlFor="portal-access"
          className="block text-sm font-semibold text-slate-900"
        >
          Email or access code
        </label>
        <p className="mt-1 text-xs text-slate-500">
          For this demo, any value works—this field is visual only.
        </p>
        <input
          id="portal-access"
          name="access"
          type="text"
          autoComplete="off"
          placeholder="you@restaurant.com"
          value={access}
          onChange={(e) => setAccess(e.target.value)}
          className="mt-3 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25"
        />
      </div>
      <button type="submit" className="btn-primary w-full">
        View My Snapshot
      </button>
    </form>
  );
}
