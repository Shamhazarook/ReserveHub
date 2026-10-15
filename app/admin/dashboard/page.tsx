
"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

type DashboardStats = {
  totalResources: number;
  totalReservations: number;
  upcomingReservations: number;
};

type ResourceStatus = "ACTIVE" | "INACTIVE";

type Resource = {
  id: string;
  name: string;
  category: string;
  location: string;
  description: string | null;
  status: ResourceStatus;
};

const emptyForm = {
  name: "",
  category: "",
  location: "",
  description: "",
};

export default function AdminDashboard() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");

  const [resources, setResources] = useState<Resource[]>([]);
  const [resourceLoading, setResourceLoading] = useState(true);
  const [resourceSaving, setResourceSaving] = useState(false);
  const [resourceError, setResourceError] = useState("");
  const [resourceMessage, setResourceMessage] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadResources = useCallback(async () => {
    setResourceLoading(true);
    setResourceError("");

    try {
      const response = await fetch("/api/admin/resources", {
        credentials: "same-origin",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setResourceError(data.message || "Unable to load resources.");
        return;
      }

      setResources(data.resources ?? []);
    } catch {
      setResourceError("Unable to connect while loading resources.");
    } finally {
      setResourceLoading(false);
    }
  }, []);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const authResponse = await fetch("/api/admin/me", {
          credentials: "same-origin",
          cache: "no-store",
        });

        if (!authResponse.ok) {
          router.replace("/admin/login");
          return;
        }

        const response = await fetch("/api/admin/dashboard", {
          credentials: "same-origin",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(data.message || "Could not load dashboard statistics.");
        } else {
          setStats(data.stats);
        }

        await loadResources();
      } catch {
        setError("Unable to connect to the server.");
      } finally {
        setChecking(false);
      }
    }

    void loadDashboard();
  }, [router, loadResources]);

  async function logout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  async function saveResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResourceSaving(true);
    setResourceError("");
    setResourceMessage("");

    try {
      const response = await fetch("/api/admin/resources", {
        method: editingId ? "PATCH" : "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ...(editingId ? { id: editingId } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setResourceError(data.message || "Unable to save resource.");
        return;
      }

      setResourceMessage(data.message || "Resource saved successfully.");
      setForm(emptyForm);
      setEditingId(null);

      await loadResources();
    } catch {
      setResourceError("Unable to connect while saving the resource.");
    } finally {
      setResourceSaving(false);
    }
  }

  function editResource(resource: Resource) {
    setEditingId(resource.id);
    setForm({
      name: resource.name,
      category: resource.category,
      location: resource.location,
      description: resource.description ?? "",
    });
    setResourceError("");
    setResourceMessage("");

    document.getElementById("resource-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(emptyForm);
    setResourceError("");
    setResourceMessage("");
  }

  async function deleteResource(resource: Resource) {
    const confirmed = window.confirm(
      `Delete "${resource.name}"? If it has reservation history, it will be deactivated instead of permanently deleted.`
    );

    if (!confirmed) return;

    setResourceError("");
    setResourceMessage("");

    try {
      const response = await fetch("/api/admin/resources", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: resource.id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setResourceError(data.message || "Unable to delete resource.");
        return;
      }

      setResourceMessage(data.message || "Resource updated successfully.");
      await loadResources();
    } catch {
      setResourceError("Unable to connect while deleting the resource.");
    }
  }

  async function toggleResourceStatus(resource: Resource) {
    setResourceError("");
    setResourceMessage("");

    try {
      const response = await fetch("/api/admin/resources", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: resource.id,
          name: resource.name,
          category: resource.category,
          location: resource.location,
          description: resource.description ?? "",
          status: resource.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setResourceError(data.message || "Unable to change resource status.");
        return;
      }

      setResourceMessage(data.message || "Resource status updated.");
      await loadResources();
    } catch {
      setResourceError("Unable to connect while changing resource status.");
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen bg-slate-50 p-8 text-slate-700">
        Checking administrator and loading dashboard...
      </main>
    );
  }

  const cards = [
    {
      label: "Total Resources",
      value: stats?.totalResources,
      icon: "▦",
      note: "Rooms and equipment",
    },
    {
      label: "Confirmed Reservations",
      value: stats?.totalReservations,
      icon: "✓",
      note: "All confirmed bookings",
    },
    {
      label: "Upcoming Reservations",
      value: stats?.upcomingReservations,
      icon: "◷",
      note: "Confirmed future bookings",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 md:flex">
      <aside className="w-full shrink-0 bg-slate-950 p-5 text-white md:min-h-screen md:w-64">
        <h1 className="text-2xl font-bold tracking-tight">
          ReserveHub<span className="text-blue-400">.</span>
        </h1>
        <p className="mt-2 text-sm text-slate-400">Resource Management</p>

        <nav className="mt-8 space-y-2">
          <a
            href="/admin/dashboard"
            className="flex rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
          >
            ▦ Dashboard
          </a>

          <a
            href="/resources"
            className="flex rounded-lg px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            ▣ Browse Resources
          </a>

          <a
            href="#resource-management"
            className="flex rounded-lg px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            ＋ Manage Resources
          </a>

          <a
            href="/admin/reservations"
            className="flex rounded-lg px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            ▤ Reservations
          </a>

          <a
            href="/admin/calendar"
            className="flex rounded-lg px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            ▥ Calendar
          </a>
        </nav>

        <div className="mt-10 rounded-xl border border-slate-700 bg-slate-900 p-4">
          <p className="text-sm font-semibold">Administrator access</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Manage shared resources and review reservation requests.
          </p>
        </div>

        <button
          onClick={logout}
          className="mt-6 w-full rounded-md border border-slate-700 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
        >
          ↪ Log out
        </button>
      </aside>

      <section className="min-w-0 flex-1 p-5 md:p-8 lg:p-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Workspace / Dashboard</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Dashboard
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Manage your shared resources and reservations in one place.
            </p>
          </div>

          <a
            href="/resources"
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Browse Resources
          </a>
        </header>

        {error && (
          <div role="alert" className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">
                  {card.label}
                </p>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600">
                  {card.icon}
                </span>
              </div>
              <p className="mt-4 text-3xl font-bold">{card.value ?? "—"}</p>
              <p className="mt-2 text-xs text-slate-500">{card.note}</p>
            </article>
          ))}
        </div>

        <section
          id="resource-management"
          className="mt-8 scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
        >
          <div className="mb-5">
            <h3 className="text-xl font-semibold">Resource Management</h3>
            <p className="mt-1 text-sm text-slate-500">
              Add resources, update details, and control availability.
            </p>
          </div>

          {resourceMessage && (
            <p role="status" className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800">
              {resourceMessage}
            </p>
          )}

          {resourceError && (
            <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
              {resourceError}
            </p>
          )}

          <form
            id="resource-form"
            onSubmit={saveResource}
            className="mb-7 grid scroll-mt-6 gap-3 sm:grid-cols-2"
          >
            <div>
              <label htmlFor="resource-name" className="mb-1 block text-sm font-medium">
                Resource Name *
              </label>
              <input
                id="resource-name"
                required
                maxLength={100}
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="e.g. Meeting Room A"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="resource-category" className="mb-1 block text-sm font-medium">
                Category *
              </label>
              <input
                id="resource-category"
                required
                maxLength={80}
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
                placeholder="e.g. Meeting Room"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="resource-location" className="mb-1 block text-sm font-medium">
                Location *
              </label>
              <input
                id="resource-location"
                required
                maxLength={150}
                value={form.location}
                onChange={(event) =>
                  setForm({ ...form, location: event.target.value })
                }
                placeholder="e.g. First Floor"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="resource-description" className="mb-1 block text-sm font-medium">
                Description
              </label>
              <input
                id="resource-description"
                maxLength={500}
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder="Optional details"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <button
                type="submit"
                disabled={resourceSaving}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {resourceSaving
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Add Resource"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-semibold">All Resources</h4>
            <button
              type="button"
              onClick={() => void loadResources()}
              disabled={resourceLoading}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-xs hover:bg-slate-50 disabled:opacity-50"
            >
              {resourceLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {resourceLoading ? (
            <p className="py-4 text-sm text-slate-500">Loading resources...</p>
          ) : resources.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-500">
              No resources found. Use the form above to add one.
            </p>
          ) : (
            <div className="space-y-3">
              {resources.map((resource) => (
                <article
                  key={resource.id}
                  className="flex flex-col justify-between gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h5 className="font-semibold">{resource.name}</h5>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          resource.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {resource.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {resource.category} · {resource.location}
                    </p>
                    {resource.description && (
                      <p className="mt-1 text-sm text-slate-500">
                        {resource.description}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => editResource(resource)}
                      className="rounded-md border border-slate-300 px-2 py-1.5 text-xs font-medium hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleResourceStatus(resource)}
                      className="rounded-md border border-slate-300 px-2 py-1.5 text-xs font-medium hover:bg-slate-50"
                    >
                      {resource.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteResource(resource)}
                      className="rounded-md bg-red-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold">Quick Actions</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="/admin/reservations"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
            >
              View Reservations
            </a>
            <a
              href="/admin/calendar"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
            >
              Open Calendar
            </a>
          </div>
        </section>

        <footer className="py-8 text-center text-xs text-slate-400">
          ReserveHub · Resource Reservation Management System
        </footer>
      </section>
    </main>
  );
}
