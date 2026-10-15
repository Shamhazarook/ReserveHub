
"use client";

import { useEffect, useState } from "react";

type Resource = {
  id: string;
  name: string;
  category: string;
  location: string;
  description: string | null;
  status: string;
};

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadResources() {
      try {
        const response = await fetch("/api/resources");
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error("Could not load resources.");
        }

        setResources(result.data);
      } catch {
        setError("Unable to load resources. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadResources();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            ReserveHub
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Available Resources
          </h1>
          <p className="mt-2 text-slate-600">
            Find and reserve the resources you need for your work.
          </p>
        </div>

        {loading && (
          <p className="text-slate-600">Loading resources...</p>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </p>
        )}

        {!loading && !error && resources.length === 0 && (
          <p className="rounded-lg bg-white p-6 text-slate-600">
            No active resources are available right now.
          </p>
        )}

        {!loading && !error && resources.length > 0 && (
          <>
            <p className="mb-5 text-sm text-slate-500">
              {resources.length} resources available
            </p>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {resources.map((resource) => (
                <article
                  key={resource.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-blue-600">
                        {resource.category}
                      </p>
                      <h2 className="mt-1 text-xl font-bold text-slate-900">
                        {resource.name}
                      </h2>
                    </div>

                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                      Active
                    </span>
                  </div>

                  <p className="text-sm text-slate-600">
                    {resource.description || "No description available."}
                  </p>

                  <p className="mt-4 text-sm text-slate-500">
                    Location: {resource.location}
                  </p>

                  <a
                    href={`/reservations/new?resourceId=${encodeURIComponent(resource.id)}`}
                    className="mt-6 block rounded-lg bg-blue-600 px-4 py-3 text-center font-semibold text-white hover:bg-blue-700"
                  >
                    Book this resource
                  </a>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
