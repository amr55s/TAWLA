import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SuperAdminHeader } from "./SuperAdminHeader";

const SUPER_ADMIN_EMAIL = "amrkhaled.contact@gmail.com";

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

	if (!user || user.email !== SUPER_ADMIN_EMAIL) {
		redirect("/login");
	}

	return (
		<div className="min-h-screen bg-[#0B1120]">
			<SuperAdminHeader email={user.email!} />
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{children}
			</main>
		</div>
	);
}
