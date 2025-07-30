import type { User } from "./auth";

export function getUserFromCookies(request: Request): User | null {
	try {
		const cookieHeader = request.headers.get("Cookie");
		
		if (!cookieHeader) {
			return null;
		}

		const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
			const [key, value] = cookie.trim().split("=");
			acc[key] = value;
			return acc;
		}, {} as Record<string, string>);

		const userCookie = cookies.user;
		
		if (!userCookie) {
			return null;
		}

		const user = JSON.parse(decodeURIComponent(userCookie));

		// Valida se tem as propriedades necessárias
		if (!user.id || !user.email || !user.firstName) {
			return null;
		}

		return user as User;
	} catch (error) {
		console.error("Erro ao decodificar cookie:", error);
		return null;
	}
}

export function createLogoutResponse(redirectTo: string = "/login") {
	return new Response(null, {
		status: 302,
		headers: {
			Location: redirectTo,
			"Set-Cookie": "user=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax"
		}
	});
} 