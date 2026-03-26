import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SuperAdminHeader } from "./SuperAdminHeader";
import { SuperAdminSidebar } from "./SuperAdminSidebar";
import { isSuperAdminUser } from "@/lib/auth/super-admin";

export const metadata = {
	title: "Super Admin — Tawla",
	description: "Tawla platform administration dashboard",
};

export default async function SuperAdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user || !isSuperAdminUser(user)) {
		redirect("/login");
	}

	return (
		<div className="min-h-screen bg-[#F6F1E8] text-[#0A1628]">
			<div
				aria-hidden
				className="pointer-events-none fixed inset-0 opacity-80"
				style={{
					background:
						"radial-gradient(circle at top left, rgba(15,76,117,0.1), transparent 28%), radial-gradient(circle at top right, rgba(50,130,184,0.12), transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.45), rgba(246,241,232,0.7))",
				}}
			/>
			<div className="relative flex min-h-screen">
				<SuperAdminSidebar />
				<div className="flex min-w-0 flex-1 flex-col px-4 py-4 sm:px-6 lg:px-8">
					<SuperAdminHeader email={user.email ?? "super-admin"} />
					<main className="mx-auto w-full max-w-7xl">{children}</main>
				</div>
			</div>
		</div>
	);
}
