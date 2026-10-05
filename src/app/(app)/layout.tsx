import { AppNav } from "@/components/nav/app-nav";
import { requireProfile } from "@/lib/auth";
import { signOut } from "@/app/login/actions";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const profile = await requireProfile();
  return (
    <>
      <AppNav name={profile.full_name || profile.email} role={profile.role} signOut={signOut} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </>
  );
}
