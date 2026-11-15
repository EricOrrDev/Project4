import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
	let supabaseResponse = NextResponse.next({
		request,
	});

	const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
	const rawKey =
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
		"";

	const supabaseUrl =
		rawUrl.replace(/^["']|["']$/g, "").trim() || "https://placeholder.supabase.co";
	const supabaseKey =
		rawKey.replace(/^["']|["']$/g, "").trim() || "placeholder-key";

	const supabase = createServerClient(supabaseUrl, supabaseKey, {
		cookies: {
			getAll() {
				return request.cookies.getAll();
			},
			setAll(cookiesToSet, headers) {
				cookiesToSet.forEach(({ name, value }) =>
					request.cookies.set(name, value),
				);
				supabaseResponse = NextResponse.next({
					request,
				});
				cookiesToSet.forEach(({ name, value, options }) =>
					supabaseResponse.cookies.set(name, value, options),
				);
				Object.entries(headers).forEach(([key, value]) =>
					supabaseResponse.headers.set(key, value),
				);
			},
		},
	});

	const { data } = await supabase.auth.getClaims();
	const user = data?.claims;

	if (
		!user &&
		!request.nextUrl.pathname.startsWith("/login") &&
		!request.nextUrl.pathname.startsWith("/auth") &&
		!request.nextUrl.pathname.startsWith("/api/images/serve")
	) {
		if (request.nextUrl.pathname.startsWith("/api")) {
			return NextResponse.json(
				{ error: "User not authenticated" },
				{ status: 401 },
			);
		}
		const url = request.nextUrl.clone();
		url.pathname = "/login";
		return NextResponse.redirect(url);
	}

	return supabaseResponse;
}
