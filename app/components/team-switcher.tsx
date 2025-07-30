import * as React from "react";
import { ChevronsUpDown, Plus } from "lucide-react";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "~/components/ui/sidebar";

type TeamLogo = React.ElementType | string;

interface Team {
	name: string;
	logo: TeamLogo;
	plan: string;
}

function TeamLogo({ logo }: { logo: TeamLogo }) {
	if (typeof logo === "string") {
		return <img src={logo} alt='Team logo' className='size-4 object-contain' />;
	}
	const IconComponent = logo;
	return <IconComponent className='size-4' />;
}

export function TeamSwitcher({ teams }: { teams: Team[] }) {
	const { isMobile } = useSidebar();
	const [activeTeam, setActiveTeam] = React.useState(teams[0]);

	if (!activeTeam) {
		return null;
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<SidebarMenuButton
						size='lg'
						className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'>
						<div className='text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
							<TeamLogo logo={activeTeam.logo} />
						</div>
						<div className='grid flex-1 text-left text-sm leading-tight'>
							<span className='truncate font-medium'>{activeTeam.name}</span>
						</div>
						<ChevronsUpDown className='ml-auto' />
					</SidebarMenuButton>

					{/* <DropdownMenuContent
						className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
						align='start'
						side={isMobile ? "bottom" : "right"}
						sideOffset={4}>
						<DropdownMenuLabel className='text-muted-foreground text-xs'>
							Teams
						</DropdownMenuLabel>
						{teams.map((team, index) => (
							<DropdownMenuItem
								key={team.name}
								onClick={() => setActiveTeam(team)}
								className='gap-2 p-2'>
								<div className='flex size-6 items-center justify-center rounded-md border'>
									<TeamLogo logo={team.logo} />
								</div>
								{team.name}
								<DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
							</DropdownMenuItem>
						))}
						<DropdownMenuSeparator />
						<DropdownMenuItem className='gap-2 p-2'>
							<div className='flex size-6 items-center justify-center rounded-md border bg-transparent'>
								<Plus className='size-4' />
							</div>
						</DropdownMenuItem>
					</DropdownMenuContent> */}
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
