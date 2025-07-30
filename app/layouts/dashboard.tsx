import { Outlet } from "react-router";
import { AppSidebar } from "~/components/app-sidebar";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Separator } from "~/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "~/components/ui/sidebar";
import type { Route } from "./+types/dashboard";
import { redirect } from "react-router";
import { getUserFromCookies } from "~/lib/session";

export async function loader({ request }: Route.LoaderArgs) {
	console.log("Dashboard Layout: Verificando autenticação...");

	// Verifica se o usuário está autenticado
	const user = getUserFromCookies(request);
	if (!user) {
		console.log(
			"Dashboard Layout: Usuário não autenticado, redirecionando para login"
		);
		throw redirect("/login");
	}

	console.log("Dashboard Layout: Usuário autenticado:", user.email);
	return { user };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
	const { user } = loaderData;

	return (
		<SidebarProvider>
			<AppSidebar user={user} />
			<SidebarInset>
				<header className='flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
					<div className='flex items-center gap-2 px-4'>
						<SidebarTrigger className='-ml-1' />
					</div>
				</header>
				<div className='flex flex-1 flex-col gap-4 p-4 pt-0'>
					<Outlet />
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
