import { NextResponse } from "next/server";

export async function GET() {
	return NextResponse.json(
		{
			success: false,
			message: "نتائج القمة القرائية غير متاحة حاليًا.",
		},
		{ status: 501 },
	);
}
