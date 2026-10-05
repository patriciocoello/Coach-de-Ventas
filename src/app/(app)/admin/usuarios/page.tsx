import { UserManager } from "@/components/admin/user-manager";
import { PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { listProfiles } from "@/lib/data/simulations";

export default async function UsersAdmin() {
  const me = await requireRole(["admin"]);
  const users = await listProfiles();
  return (
    <>
      <PageHeader eyebrow="Admin" title="Usuarios" description="Da de alta a tus vendedores con correo y contraseña. Los gerentes ven al equipo; los admins además administran el contenido." />
      <UserManager users={users} meId={me.id} />
    </>
  );
}
