import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { createLogoutResponse } from "~/lib/session";

export async function action({ request }: ActionFunctionArgs) {
	console.log("Logout: Fazendo logout do usuário");
	return createLogoutResponse("/login");
}

export async function loader({ request }: LoaderFunctionArgs) {
	console.log("Logout: Redirecionamento direto para login");
	return createLogoutResponse("/login");
}
