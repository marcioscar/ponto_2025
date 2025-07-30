import type { Route } from "./+types/home";
import { redirect } from "react-router";
import { getUserFromCookies } from "~/lib/session";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "New React Router App" },
		{ name: "description", content: "Welcome to React Router!" },
	];
}

export async function loader({ request }: Route.LoaderArgs) {
	// Verifica se o usuário está logado
	const user = getUserFromCookies(request);

	if (!user) {
		throw redirect("/login");
	}

	// Redireciona baseado no role do usuário
	if (user.role === "admin") {
		throw redirect("/adm");
	} else {
		// Para qualquer outro role (user, etc.)
		throw redirect("/funcionario");
	}
}

export default function Home() {
	// Este componente nunca será renderizado pois o loader sempre redireciona
	return <div>Redirecionando...</div>;
}
