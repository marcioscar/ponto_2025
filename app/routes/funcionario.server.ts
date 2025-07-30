import { redirect } from "react-router";
import { getUserFromCookies } from "~/lib/session";
import {
	getUser,
	baterPonto,
} from "~/lib/user";
import { type TipoPonto } from "~/lib/client-utils";
import type { Route } from "./+types/funcionario";

export async function funcionarioLoader({ request }: Route.LoaderArgs) {
	// Verifica se o usuário está autenticado
	const user = getUserFromCookies(request);

	if (!user) {
		throw redirect("/login");
	}

	// Busca dados completos do usuário
	const userData = await getUser(user.id);
	
	if (!userData) {
		throw redirect("/login");
	}

	// Captura parâmetros da URL para exibir toasts
	const url = new URL(request.url);
	const success = url.searchParams.get("success");
	const error = url.searchParams.get("error");

	return { user: userData, success, error };
}

export async function funcionarioAction({ request }: Route.ActionArgs) {
	// Verifica se o usuário está autenticado
	const user = getUserFromCookies(request);
	if (!user) {
		throw redirect("/login");
	}

	const formData = await request.formData();
	const action = formData.get("_action") as string;

	if (action === "bater-ponto") {
		const tipoPonto = formData.get("tipoPonto") as TipoPonto;

		try {
			await baterPonto(user.id, tipoPonto);
			return redirect("/funcionario?success=Ponto registrado com sucesso!");
		} catch (error) {
			console.error("Erro ao bater ponto:", error);
			return redirect("/funcionario?error=Erro ao registrar ponto");
		}
	}

	return redirect("/funcionario");
} 