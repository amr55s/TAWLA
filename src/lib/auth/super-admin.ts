type AuthLikeUser = {
	user_metadata?: Record<string, unknown> | null;
} | null | undefined;

export function isSuperAdminUser(user: AuthLikeUser): boolean {
	const flag = user?.user_metadata?.is_super_admin;
	return flag === true || flag === "true";
}
