import { AdminNav } from "@/components/admin/admin-nav";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireRole(["admin"]);
  return (
    <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
      <AdminNav />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
