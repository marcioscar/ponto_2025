import type { User } from "@prisma/client";
import { LogOut, Plus } from "lucide-react";
import { Form, redirect } from "react-router";
import { columns } from "~/components/columns";
import { DataTable } from "~/components/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { getUserFromCookies } from "~/lib/session";
import { getUsers } from "~/lib/user";
import { prisma } from "~/lib/prisma";
import bcrypt from "bcryptjs";
import type { Route } from "./+types/adm";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { z } from "zod";

const FuncionarioSchema = z.object({
	nome: z.string().min(1, { message: "Nome é obrigatório" }),
	sobrenome: z.string().min(1, { message: "Sobrenome é obrigatório" }),
	email: z.string().email({ message: "Email inválido" }),
	senha: z.string().optional(),
});

const NovoFuncionarioSchema = z.object({
	nome: z.string().min(1, { message: "Nome é obrigatório" }),
	sobrenome: z.string().min(1, { message: "Sobrenome é obrigatório" }),
	email: z.string().email({ message: "Email inválido" }),
	senha: z
		.string()
		.min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
});

export async function loader({ request }: { request: Request }) {
	// Verifica se o usuário está autenticado e se é admin
	const user = getUserFromCookies(request);
	if (!user || user.role !== "admin") {
		throw redirect("/login");
	}

	// Busca todos os usuários
	const users = await getUsers();

	// Verifica se há mensagem de sucesso na URL
	const url = new URL(request.url);
	const success = url.searchParams.get("success");
	const nome = url.searchParams.get("nome");
	const error = url.searchParams.get("error");
	const detalhes = url.searchParams.get("detalhes");

	return { user, users, success, nome, error, detalhes };
}

export async function action({ request }: Route.ActionArgs) {
	// Verifica se o usuário está autenticado e se é admin
	const user = getUserFromCookies(request);
	if (!user || user.role !== "admin") {
		throw redirect("/login");
	}

	const formData = await request.formData();
	const action = formData.get("_action");

	if (action === "save") {
		const userId = formData.get("userId") as string;
		const nome = formData.get("nome") as string;
		const sobrenome = formData.get("sobrenome") as string;
		const email = formData.get("email") as string;
		const senha = formData.get("senha") as string;

		// Validação básica do userId
		if (!userId) {
			return new Response("ID do usuário não fornecido", { status: 400 });
		}

		// Validação dos dados usando Zod
		try {
			const dadosValidados = FuncionarioSchema.parse({
				nome,
				sobrenome,
				email,
				senha: senha || undefined,
			});

			// Prepara dados para atualização
			const dadosParaAtualizar: any = {
				firstName: dadosValidados.nome.trim(),
				lastName: dadosValidados.sobrenome.trim(),
				email: dadosValidados.email.trim().toLowerCase(),
			};

			// Só atualiza senha se foi fornecida
			if (dadosValidados.senha && dadosValidados.senha.trim() !== "") {
				const senhaHash = await bcrypt.hash(dadosValidados.senha.trim(), 10);
				dadosParaAtualizar.password = senhaHash;
			}

			// Verifica se o email já existe para outro usuário
			const existeOutroUsuario = await prisma.user.findFirst({
				where: {
					email: dadosParaAtualizar.email,
					id: { not: userId },
				},
			});

			if (existeOutroUsuario) {
				return redirect(`/adm?error=email-existente`);
			}

			// Atualiza o usuário no banco
			await prisma.user.update({
				where: { id: userId },
				data: dadosParaAtualizar,
			});

			// Redireciona com mensagem de sucesso
			return redirect(
				`/adm?success=funcionario-atualizado&nome=${encodeURIComponent(
					dadosValidados.nome.trim()
				)}`
			);
		} catch (validationError) {
			if (validationError instanceof z.ZodError) {
				const errors = validationError.errors
					.map((err) => err.message)
					.join(", ");
				return redirect(
					`/adm?error=validacao&detalhes=${encodeURIComponent(errors)}`
				);
			}
			console.error("Erro ao atualizar funcionário:", validationError);
			return new Response("Erro interno do servidor", { status: 500 });
		}
	}

	if (action === "create") {
		const nome = formData.get("nome") as string;
		const sobrenome = formData.get("sobrenome") as string;
		const email = formData.get("email") as string;
		const senha = formData.get("senha") as string;

		// Validação dos dados usando Zod
		try {
			const dadosValidados = NovoFuncionarioSchema.parse({
				nome,
				sobrenome,
				email,
				senha,
			});

			// Verifica se o email já existe
			const existeUsuario = await prisma.user.findFirst({
				where: {
					email: dadosValidados.email.trim().toLowerCase(),
				},
			});

			if (existeUsuario) {
				return redirect(`/adm?error=email-existente`);
			}

			// Cria hash da senha
			const senhaHash = await bcrypt.hash(dadosValidados.senha.trim(), 10);

			// Cria o novo usuário no banco
			await prisma.user.create({
				data: {
					firstName: dadosValidados.nome.trim(),
					lastName: dadosValidados.sobrenome.trim(),
					email: dadosValidados.email.trim().toLowerCase(),
					password: senhaHash,
					role: "user", // Define como usuário comum por padrão
				},
			});

			// Redireciona com mensagem de sucesso
			return redirect(
				`/adm?success=funcionario-criado&nome=${encodeURIComponent(
					dadosValidados.nome.trim()
				)}`
			);
		} catch (validationError) {
			if (validationError instanceof z.ZodError) {
				const errors = validationError.errors
					.map((err) => err.message)
					.join(", ");
				return redirect(
					`/adm?error=validacao&detalhes=${encodeURIComponent(errors)}`
				);
			}
			console.error("Erro ao criar funcionário:", validationError);
			return new Response("Erro interno do servidor", { status: 500 });
		}
	}

	return new Response("Ação não reconhecida", { status: 400 });
}

export default function Adm({
	loaderData,
}: {
	loaderData: {
		user: User;
		users: User[];
		success: string | null;
		nome: string | null;
		error: string | null;
		detalhes: string | null;
	};
}) {
	const { user, users, success, nome, error, detalhes } = loaderData;

	const [dialogOpen, setDialogOpen] = useState(false);

	useEffect(() => {
		if (success === "funcionario-atualizado") {
			toast.success(`Funcionário ${nome || ""} atualizado com sucesso!`, {
				description: "As alterações foram salvas no sistema.",
				duration: 4000,
			});
		}
		if (success === "funcionario-criado") {
			toast.success(`Funcionário ${nome || ""} criado com sucesso!`, {
				description: "O novo funcionário foi adicionado ao sistema.",
				duration: 4000,
			});
			setDialogOpen(false); // Fecha o dialog após sucesso
		}
		if (error === "email-existente") {
			toast.error("Email já em uso por outro usuário.", {
				description: "Por favor, escolha outro email.",
				duration: 4000,
			});
		}
		if (error === "validacao") {
			if (detalhes) {
				toast.error(detalhes, {
					description: "Por favor, verifique os campos obrigatórios.",
					duration: 4000,
				});
			} else {
				toast.error("Erro de validação. Por favor, tente novamente.", {
					description: "Por favor, verifique os campos obrigatórios.",
					duration: 4000,
				});
			}
		}
	}, [success, nome, error, detalhes]);

	return (
		<div>
			<div className='flex items-center gap-9 justify-end w-full mx-auto px-8 py-4'>
				<div className='flex justify-start w-xl'>
					<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
						<DialogTrigger asChild>
							<Button>
								<Plus />
								Novo Funcionário
							</Button>
						</DialogTrigger>
						<DialogContent className='sm:max-w-[425px]'>
							<DialogHeader>
								<DialogTitle>Cadastrar Novo Funcionário</DialogTitle>
							</DialogHeader>
							<Form method='post'>
								<input type='hidden' name='_action' value='create' />
								<div className='grid gap-4 py-4'>
									<div className='grid gap-2'>
										<Label htmlFor='nome'>Nome</Label>
										<Input
											id='nome'
											name='nome'
											type='text'
											placeholder='Digite o nome'
											required
										/>
									</div>
									<div className='grid gap-2'>
										<Label htmlFor='sobrenome'>Sobrenome</Label>
										<Input
											id='sobrenome'
											name='sobrenome'
											type='text'
											placeholder='Digite o sobrenome'
											required
										/>
									</div>
									<div className='grid gap-2'>
										<Label htmlFor='email'>Email</Label>
										<Input
											id='email'
											name='email'
											type='email'
											placeholder='funcionario@empresa.com'
											required
										/>
									</div>
									<div className='grid gap-2'>
										<Label htmlFor='senha'>Senha</Label>
										<Input
											id='senha'
											name='senha'
											type='password'
											placeholder='Digite a senha (mín. 6 caracteres)'
											required
											minLength={6}
										/>
									</div>
								</div>
								<DialogFooter>
									<Button
										type='button'
										variant='outline'
										onClick={() => setDialogOpen(false)}>
										Cancelar
									</Button>
									<Button type='submit'>Cadastrar</Button>
								</DialogFooter>
							</Form>
						</DialogContent>
					</Dialog>
				</div>
				<div className='flex items-center gap-4'>
					<Avatar className='h-8 w-8 rounded-lg'>
						<AvatarImage
							src={"/avatars/" + user.firstName + ".jpg"}
							alt={user.firstName}
						/>
						<AvatarFallback className='rounded-lg'>
							{user.firstName.charAt(0) + user.lastName.charAt(0)}
						</AvatarFallback>
					</Avatar>
					<div className='grid text-left text-sm leading-tight'>
						<span className='truncate font-medium'>{user.firstName}</span>
						<span className='truncate text-xs'>{user.email}</span>
					</div>
				</div>
				<Form action='/logout' method='post'>
					<Button type='submit' variant='ghost'>
						<LogOut />
						Sair
					</Button>
				</Form>
			</div>

			<div className='container mx-auto '>
				<DataTable columns={columns} data={users as any} />
			</div>
			{/* <ul>
				{users.map((user) => (
					<li key={user.id}>
						{user.firstName} {user.lastName}
					</li>
				))}
			</ul> */}
		</div>
	);
}
