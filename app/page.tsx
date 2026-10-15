
const resources = [
  { name: "Meeting Room A", type: "Meeting Room", location: "Floor 1", status: "Available", icon: "🏢" },
  { name: "Projector 01", type: "Equipment", location: "IT Department", status: "Available", icon: "📽️" },
  { name: "Conference Room", type: "Meeting Room", location: "Floor 2", status: "Reserved", icon: "👥" },
  { name: "Laptop 04", type: "Equipment", location: "IT Department", status: "Available", icon: "💻" },
];

const bookings = [
  { resource: "Conference Room", person: "Amara Perera", time: "09:00 AM – 10:00 AM", status: "Approved" },
  { resource: "Projector 01", person: "Kamal Silva", time: "10:30 AM – 11:30 AM", status: "Pending" },
  { resource: "Meeting Room A", person: "Nadeesha Fernando", time: "01:00 PM – 02:00 PM", status: "Approved" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 md:flex">
      <aside className="w-full shrink-0 bg-slate-950 p-5 text-white md:min-h-screen md:w-64">
        <h1 className="text-2xl font-bold tracking-tight">ReserveHub<span className="text-blue-400">.</span></h1>
        <p className="mt-2 text-sm text-slate-400">Resource Management</p>

        <nav className="mt-8 space-y-2">
          {[
            ["▦", "Dashboard"],
            ["▣", "Resources"],
            ["▤", "Reservations"],
            ["▥", "my-Calendar"],
            
            
          ].map(([icon, label], index) => (
            <a
              key={label}
              href={index === 0 ? "/" : `/${label.toLowerCase()}`}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition ${
                index === 0
                  ? "bg-blue-600 font-semibold text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span>{icon}</span>{label}
            </a>
          ))}
        </nav>

        <div className="mt-10 rounded-xl border border-slate-700 bg-slate-900 p-4">
          <p className="text-sm font-semibold">Need assistance?</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Contact your resource administrator for help with bookings.
          </p>
        </div>

        <p className="mt-8 text-xs text-slate-500">ReserveHub · Local Demo</p>
      </aside>

      <section className="min-w-0 flex-1 p-5 md:p-8 lg:p-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Workspace / Dashboard</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="mt-2 text-sm text-slate-500">
              Manage your shared resources and reservations in one place.
            </p>
          </div>
          <a
            href="/reservations/new"
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            + New Reservation
          </a>
        </header>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Resources", value: "24", icon: "▦", note: "Across all categories" },
            { label: "Available Now", value: "16", icon: "✓", note: "Ready for use" },
            { label: "Today's Reservations", value: "12", icon: "▤", note: "Scheduled for today" },
            { label: "Pending Requests", value: "3", icon: "◷", note: "Awaiting approval" },
          ].map((card) => (
            <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600">
                  {card.icon}
                </span>
              </div>
              <p className="mt-4 text-3xl font-bold">{card.value}</p>
              <p className="mt-2 text-xs text-slate-500">{card.note}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white xl:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h3 className="font-semibold">Resource Overview</h3>
                <p className="mt-1 text-sm text-slate-500">A quick look at shared facilities</p>
              </div>
              <a href="/resources" className="text-sm font-semibold text-blue-600 hover:underline">
                View all →
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-medium">Resource</th>
                    <th className="px-5 py-4 font-medium">Location</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resources.map((resource) => (
                    <tr key={resource.name} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
                            {resource.icon}
                          </span>
                          <div>
                            <p className="font-semibold">{resource.name}</p>
                            <p className="mt-1 text-xs text-slate-500">{resource.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-500">{resource.location}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                          resource.status === "Available"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}>
                          {resource.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 p-5">
              <h3 className="font-semibold">Quick Actions</h3>
              <p className="mt-1 text-sm text-slate-500">Common tasks</p>
            </div>
            <div className="space-y-3 p-5">
              <a href="/reservations/new" className="block rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50">
                <p className="font-semibold">＋ Make a reservation</p>
                <p className="mt-1 text-xs text-slate-500">Request a room or resource</p>
              </a>
              <a href="/resources" className="block rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50">
                <p className="font-semibold">▦ Browse resources</p>
                <p className="mt-1 text-xs text-slate-500">Explore available facilities</p>
              </a>
              <a href="/reservations" className="block rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50">
                <p className="font-semibold">▤ View reservations</p>
                <p className="mt-1 text-xs text-slate-500">Review booking requests</p>
              </a>
            </div>
          </section>
        </div>

        
             

        <footer className="py-8 text-center text-xs text-slate-400">
          ReserveHub · Resource Reservation Management System
        </footer>
      </section>
    </main>
  );
}
