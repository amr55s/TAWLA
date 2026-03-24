import { NextRequest, NextResponse } from "next/server";

const COUNTRY_CURRENCY_MAP: Record<string, { currency: string; symbol: string }> = {
	EG: { currency: "EGP", symbol: "ج.م" },
	SA: { currency: "SAR", symbol: "ر.س" },
	KW: { currency: "KWD", symbol: "د.ك" },
	AE: { currency: "AED", symbol: "د.إ" },
	QA: { currency: "QAR", symbol: "ر.ق" },
	BH: { currency: "BHD", symbol: "د.ب" },
	OM: { currency: "OMR", symbol: "ر.ع" },
	JO: { currency: "JOD", symbol: "د.أ" },
	LB: { currency: "LBP", symbol: "ل.ل" },
	US: { currency: "USD", symbol: "$" },
	GB: { currency: "GBP", symbol: "£" },
	EU: { currency: "EUR", symbol: "€" },
};

const TIMEZONE_COUNTRY_MAP: Record<string, string> = {
	"Africa/Cairo": "EG",
	"Asia/Riyadh": "SA",
	"Asia/Kuwait": "KW",
	"Asia/Dubai": "AE",
	"Asia/Qatar": "QA",
	"Asia/Bahrain": "BH",
	"Asia/Muscat": "OM",
	"Asia/Amman": "JO",
	"Asia/Beirut": "LB",
};

export async function GET(request: NextRequest) {
	// 1. Try Vercel's IP country header (production)
	const vercelCountry = request.headers.get("x-vercel-ip-country");

	if (vercelCountry && COUNTRY_CURRENCY_MAP[vercelCountry]) {
		return NextResponse.json({
			country: vercelCountry,
			...COUNTRY_CURRENCY_MAP[vercelCountry],
			source: "vercel-header",
		});
	}

	// 2. Fallback: Accept a timezone query param from the client
	const tz = request.nextUrl.searchParams.get("tz");
	if (tz && TIMEZONE_COUNTRY_MAP[tz]) {
		const country = TIMEZONE_COUNTRY_MAP[tz];
		return NextResponse.json({
			country,
			...COUNTRY_CURRENCY_MAP[country],
			source: "timezone",
		});
	}

	// 3. Default to USD
	return NextResponse.json({
		country: "US",
		currency: "USD",
		symbol: "$",
		source: "default",
	});
}
