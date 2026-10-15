
"use client";

import { Suspense, useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type LoginRole = "employee" | "admin";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [role, setRole] = useState<LoginRole>("employee");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("role") === "admin") {
      setRole("admin");
    }

    if (searchParams.get("registered") === "1") {
      setMessage("Registration successful! Please log in.");
    }
  }, [searchParams]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const endpoint =
        role === "admin"
          ? "/api/admin/login"
          : "/api/auth/login";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed. Please try again.");
        return;
      }

      if (role === "admin") {
  router.replace("/admin/dashboard");
} else {
  router.replace("/");
}

router.refresh();
    } catch {
      setMessage("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-center text-3xl font-bold text-slate-800">
          ReserveHub
        </h1>

        <p className="mt-2 text-center text-sm text-slate-500">
          Resource Reservation Management System
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="role"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Login As
            </label>

            <select
              id="role"
              value={role}
              onChange={(e) => {
                setRole(e.target.value as LoginRole);
                setMessage("");
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="employee">Employee</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Email Address
            </label>

            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Enter your password"
            />
          </div>

          {message && (
            <p
              role="alert"
              className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800"
            >
              {message}
            </p>
          )}

          {role === "admin" && (
            <p className="text-sm text-slate-500">
              Administrator access is for authorized accounts only.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        {role === "employee" && (
          <p className="mt-6 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-blue-600 hover:underline"
            >
              Register here
            </Link>
          </p>
        )}

        <p className="mt-5 text-center text-xs text-slate-400">
          Secure Resource Reservation Management
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          <p className="text-slate-600">Loading login...</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
