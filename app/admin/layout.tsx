import AdminNav from "@/app/components/admin/AdminNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-zinc-800 sticky top-0 z-20 bg-black/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <AdminNav />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
    </main>
  );
}