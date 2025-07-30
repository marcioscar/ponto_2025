import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "./ui/button";
import {
	ArrowUpDown,
	ClockIcon,
	Edit,
	Edit2,
	Edit2Icon,
	Edit3,
	Edit3Icon,
	Pencil,
	PencilOff,
	PersonStanding,
	PersonStandingIcon,
} from "lucide-react";
import { Form, Link, NavLink } from "react-router";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

export function LoggedOutMessage() {
	return (
		<p>
			You've been logged out. <Link to='/login'>Login again</Link>
		</p>
	);
}

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Usuario = {
	password: string | number | readonly string[] | undefined;
	user: any;
	firstName: string;
	lastName: string;
	role: string;
	email: string;
	id: string;
};

export const columns: ColumnDef<Usuario>[] = [
	{
		accessorKey: "firstName",
		header: ({ column }) => {
			return (
				<Button
					variant='ghost'
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
					Nome
					<ArrowUpDown className='ml-2 h-4 w-4' />
				</Button>
			);
		},
		cell: ({ row }) => {
			const firstName = row.getValue("firstName") as string;
			const lastName = row.original.lastName as string;
			return `${firstName} ${lastName}`;
		},
	},

	{
		accessorKey: "email",
		header: "Email",
	},
	{
		id: "actions",
		cell: ({ row }) => {
			const funcionario = row.original;
			return (
				<NavLink
					to={`/adm/${funcionario.id}`}
					className=' inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-primary text-primary-foreground hover:bg-primary/80 h-9 px-4 py-2'>
					<ClockIcon className='mr-2 h-4 w-4' />
					Ponto
				</NavLink>
			);
		},
	},
	{
		id: "actions",
		cell: ({ row }) => {
			const pontoData = row.original;
			return (
				<Dialog>
					<DialogTrigger asChild>
						<Button variant='secondary' className=' py-2  h-8 '>
							<Edit3Icon className='w-4 h-4 mr-1' />
							Funcionário
						</Button>
					</DialogTrigger>
					<DialogContent className=' min-w-[500px] bg-white sm:max-w-[425px]'>
						<DialogHeader>
							<DialogTitle>Editar Funcionário</DialogTitle>
							<DialogDescription className='text-blue-500'>
								{pontoData.firstName} {pontoData.lastName}
							</DialogDescription>
						</DialogHeader>
						<Form method='post'>
							<input hidden value={pontoData.id} name='userId' id='userId' />

							<div className='grid gap-4 py-4'>
								<div className='grid grid-cols-4 items-center gap-4'>
									<Label htmlFor='nome' className='text-right '>
										Nome
									</Label>
									<Input
										id='nome'
										name='nome'
										defaultValue={pontoData.firstName}
										className='col-span-2'
									/>
								</div>
							</div>
							<div className='grid gap-4 py-4'>
								<div className='grid grid-cols-4 items-center gap-4'>
									<Label htmlFor='sobrenome' className='text-right '>
										Sobrenome
									</Label>
									<Input
										id='sobrenome'
										name='sobrenome'
										defaultValue={pontoData.lastName}
										className='col-span-2'
									/>
								</div>
							</div>
							<div className='grid gap-4 py-4'>
								<div className='grid grid-cols-4 items-center gap-4'>
									<Label htmlFor='email' className='text-right '>
										Email
									</Label>
									<Input
										id='email'
										name='email'
										defaultValue={pontoData.email}
										className='col-span-2'
									/>
								</div>
							</div>
							<div className='grid gap-4 py-4'>
								<div className='grid grid-cols-4 items-center gap-4'>
									<Label htmlFor='senha' className='text-right '>
										Senha
									</Label>
									<Input
										type='password'
										id='senha'
										placeholder='Preencher se for alterar'
										name='senha'
										className='col-span-2'
									/>
								</div>
							</div>

							<DialogFooter>
								<DialogClose asChild>
									<Button
										type='submit'
										name='_action'
										value='save'
										className='bg-emerald-500'>
										Salvar
									</Button>
								</DialogClose>
							</DialogFooter>
						</Form>
					</DialogContent>
				</Dialog>
			);
		},
	},
];
