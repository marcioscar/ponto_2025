import { Outlet } from "react-router";

export default function Layout() {
	return (
		<div className='flex container mx-auto  w-full items-center justify-center '>
			<div className='w-full '>
				<img
					src='/logo brassaco.svg'
					alt='Logo Brassaco'
					className='h-16 w-auto mx-auto mb-8'
				/>
				<Outlet />
			</div>
		</div>
	);
}
