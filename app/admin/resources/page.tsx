"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";

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

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadResources = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/resources", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to load resources.");
        return;
      }

      setResources(data.resources ?? []);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/resources", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ...(editingId ? { id: editingId } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to save resource.");
        return;
      }

      setMessage(data.message || "Resource saved successfully.");
      setForm(emptyForm);
      setEditingId(null);
      await loadResources();
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setSaving(false);
    }
  }

  function startEditing(resource: Resource) {
    setEditingId(resource.id);
    setForm({
      name: resource.name,
      category: resource.category,
      location: resource.location,
      description: resource.description ?? "",
    });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
  }

  async function deleteResource(resource: Resource) {
    const confirmed = window.confirm(
      `Delete or deactivate "${resource.name}"? Resources with reservation history will be deactivated instead of permanently deleted.`
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/resources", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: resource.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to delete resource.");
        return;
      }

      setMessage(data.message || "Resource updated successfully.");
      await loadResources();
    } catch {
      setError("Unable to connect to the server.");
    }
  }

  async function toggleStatus(resource: Resource) {
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/resources", {
        method: "PATCH",
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

      if (!response.ok) {
        setError(data.message || "Unable to change resource status.");
        return;
      }

      setMessage(data.message || "Resource status updated.");
      await loadResources();
    } catch {
      setError("Unable to connect to the server.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Resource Management
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Add, edit, and manage organizational resources.
            </p>
          </div>

          <Link
            href="/admin/dashboard"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
          >
            Back to Dashboard
          </Link>
        </header>

        {message && (
          <p
            role="status"
            className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800"
          >
            {message}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800"
          >
            {error}
            {error.toLowerCase().includes("unauthorized") && (
              <>
                {" "}
                <Link
                  href="/admin/login"
                  className="font-semibold underline"
                >
                  Admin Login
                </Link>
              </>
            )}
          </p>
        )}

        <section className="mb-8 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            {editingId ? "Edit Resource" : "Add New Resource"}
          </h2>

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="resource-name"
                className="mb-1 block text-sm font-medium"
              >
                Resource Name *
              </label>
              <input
                id="resource-name"
                required
                maxLength={100}
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                placeholder="e.g. Meeting Room A"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="resource-category"
                className="mb-1 block text-sm font-medium"
              >
                Category *
              </label>
              <input
                id="resource-category"
                required
                maxLength={80}
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                placeholder="e.g. Meeting Room"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="resource-location"
                className="mb-1 block text-sm font-medium"
              >
                Location *
              </label>
              <input
                id="resource-location"
                required
                maxLength={150}
                value={form.location}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
                placeholder="e.g. First Floor"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="resource-description"
                className="mb-1 block text-sm font-medium"
              >
                Description
              </label>
              <input
                id="resource-description"
                maxLength={500}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Optional details"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving
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
        </section>

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">
              All Resources
            </h2>
            <span className="text-sm text-slate-500">
              {resources.length} total
            </span>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading resources...</p>
          ) : resources.length === 0 ? (
            <p className="text-sm text-slate-500">
              No resources found. Add your first resource above.
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
                      <h3 className="font-semibold text-slate-800">
                        {resource.name}
                      </h3>
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
                      onClick={() => startEditing(resource)}
                      className="rounded-md border border-slate-300 px-2 py-1.5 text-xs font-medium hover:bg-slate-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => void toggleStatus(resource)}
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
      </div>
    </main>
  );
}