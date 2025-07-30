import * as React from "react";
import {
	AudioWaveform,
	BookOpen,
	Bot,
	Command,
	Frame,
	GalleryVerticalEnd,
	Map,
	PieChart,
	Settings2,
	SquareTerminal,
	Building2,
	Check,
	FileClock,
	ShieldUser,
} from "lucide-react";

import { NavMain } from "~/components/nav-main";
import { NavProjects } from "~/components/nav-projects";
import { NavUser } from "~/components/nav-user";
import { TeamSwitcher } from "~/components/team-switcher";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "~/components/ui/sidebar";

// This is sample data.
const data = {
	user: {
		name: "Marcio",
		email: "marcioscar@gmail.com",
		firstName: "Marcio",
	},
	teams: [
		{
			name: "Brassaco Embalagens",
			logo: "/avatars/icon.png",
			plan: "Enterprise",
		},
	],
	navMain: [
		{
			title: "Ponto",
			url: "#",
			icon: FileClock,
			isActive: true,
			items: [
				{
					title: "History",
					url: "#",
				},
				{
					title: "Starred",
					url: "#",
				},
				{
					title: "Settings",
					url: "#",
				},
			],
		},
		{
			title: "Administração",
			url: "#",
			icon: ShieldUser,
			items: [
				{
					title: "Genesis",
					url: "#",
				},
				{
					title: "Explorer",
					url: "#",
				},
				{
					title: "Quantum",
					url: "#",
				},
			],
		},
		{
			title: "Documentation",
			url: "#",
			icon: BookOpen,
			items: [
				{
					title: "Introduction",
					url: "#",
				},
				{
					title: "Get Started",
					url: "#",
				},
				{
					title: "Tutorials",
					url: "#",
				},
				{
					title: "Changelog",
					url: "#",
				},
			],
		},
		{
			title: "Settings",
			url: "#",
			icon: Settings2,
			items: [
				{
					title: "General",
					url: "#",
				},
				{
					title: "Team",
					url: "#",
				},
				{
					title: "Billing",
					url: "#",
				},
				{
					title: "Limits",
					url: "#",
				},
			],
		},
	],
};

export function AppSidebar({
	user: loggedUser,
	...props
}: React.ComponentProps<typeof Sidebar> & {
	user?: {
		id: string;
		email: string;
		firstName: string;
		lastName: string;
		role: string;
	};
}) {
	// Usa o usuário logado se disponível, senão usa dados estáticos
	const userForNavUser = loggedUser
		? {
				name: `${loggedUser.firstName} ${loggedUser.lastName}`,
				email: loggedUser.email,
				firstName: loggedUser.firstName,
				lastName: loggedUser.lastName,
		  }
		: { ...data.user, lastName: "Carneiro" };

	return (
		<Sidebar collapsible='icon' {...props}>
			<SidebarHeader>
				<TeamSwitcher teams={data.teams} />
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={userForNavUser} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
