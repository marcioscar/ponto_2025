import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
	route("login", "routes/login.tsx"),
	route("logout", "routes/logout.tsx"),
	// Fora do layout para teste
	
	layout('layouts/layout.tsx', [
		index("routes/home.tsx"),
		route("funcionario", "routes/funcionario.tsx"),
		route("adm", "routes/adm.tsx"),
		route("adm/:id", "routes/adm.$id.tsx"),
	])
] satisfies RouteConfig; 
