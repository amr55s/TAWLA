export const PRO_TRIAL_DAYS = 15;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getTrialEndsAtFromNow(days = PRO_TRIAL_DAYS): string {
	return new Date(Date.now() + days * MS_PER_DAY).toISOString();
}

export function getTrialDaysRemaining(trialEndsAt: string | null | undefined): number {
	if (!trialEndsAt) return 0;

	return Math.max(
		0,
		Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / MS_PER_DAY),
	);
}
