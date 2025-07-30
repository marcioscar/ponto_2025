import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { Route } from "./+types/login";
import { Form, redirect, useFetcher } from "react-router";
import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { prisma } from "~/lib/prisma";
import bcrypt from "bcryptjs";
import React from "react";
import z from "zod";

const LoginSchema = z.object({
	email: z.string().email({ message: "Email inválido" }),
	password: z.string().min(4, { message: "Senha inválida" }),
});

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData();
	const submission = parseWithZod(formData, { schema: LoginSchema });

	if (submission.status !== "success") {
		return submission.reply();
	}

	const { email, password } = submission.value;

	try {
		// Busca o usuário no banco
		const user = await prisma.user.findFirst({
			where: {
				email: {
					equals: email,
					mode: "insensitive",
				},
			},
			select: {
				id: true,
				email: true,
				firstName: true,
				lastName: true,
				role: true,
				password: true,
			},
		});

		if (!user) {
			return submission.reply({
				formErrors: ["Credenciais inválidas"],
			});
		}

		// Verifica a senha
		const passwordMatch = await bcrypt.compare(password, user.password);

		if (!passwordMatch) {
			return submission.reply({
				formErrors: ["Credenciais inválidas"],
			});
		}

		// Remove a senha do retorno
		const { password: _, ...userWithoutPassword } = user;

		// Cria um cookie de sessão
		const userCookie = `user=${encodeURIComponent(
			JSON.stringify(userWithoutPassword)
		)}; Path=/; Max-Age=${7 * 24 * 60 * 60}; HttpOnly; SameSite=Lax`;

		const redirectUrl =
			userWithoutPassword.role === "user" ? "/funcionario" : "/adm";

		// Redirecionamento do servidor
		return redirect(redirectUrl, {
			headers: {
				"Set-Cookie": userCookie,
			},
		});
	} catch (error) {
		console.error("Erro no login:", error);
		return submission.reply({
			formErrors: ["Erro interno do servidor"],
		});
	}
}

export default function Login() {
	const fetcher = useFetcher();

	const [form, fields] = useForm({
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: LoginSchema });
		},
		shouldValidate: "onBlur",
		shouldRevalidate: "onInput",
	});

	return (
		<div className='flex min-h-svh w-full items-center justify-center p-6 md:p-10'>
			<div className='w-full max-w-sm'>
				<img
					src='/logo brassaco.svg'
					alt='Logo Brassaco'
					className='w-full h-auto mb-6'
				/>
				<div className='flex flex-col'>
					<Card>
						<CardHeader>
							<CardTitle>Ponto Eletrônico</CardTitle>
							<CardDescription>
								Entre com seu email para acessar o sistema
							</CardDescription>
						</CardHeader>
						<CardContent>
							<fetcher.Form
								method='post'
								id={form.id}
								onSubmit={form.onSubmit}
								noValidate={form.noValidate}>
								<div className='flex flex-col gap-6'>
									{form.errors && (
										<div className='text-red-500 text-sm'>
											{form.errors.map((error, index) => (
												<div key={index}>{error}</div>
											))}
										</div>
									)}

									<div className='grid gap-3'>
										<Label htmlFor={fields.email.id}>Email</Label>
										<Input
											key={fields.email.key}
											id={fields.email.id}
											name={fields.email.name}
											type='email'
											defaultValue={fields.email.initialValue}
											aria-invalid={fields.email.errors ? true : undefined}
											aria-describedby={
												fields.email.errors
													? `${fields.email.id}-error`
													: undefined
											}
											required
										/>
										{fields.email.errors && (
											<div
												id={`${fields.email.id}-error`}
												className='text-red-500 text-sm'>
												{fields.email.errors}
											</div>
										)}
									</div>

									<div className='grid gap-3'>
										<Label htmlFor={fields.password.id}>Senha</Label>
										<Input
											key={fields.password.key}
											id={fields.password.id}
											name={fields.password.name}
											type='password'
											defaultValue={fields.password.initialValue}
											aria-invalid={fields.password.errors ? true : undefined}
											aria-describedby={
												fields.password.errors
													? `${fields.password.id}-error`
													: undefined
											}
											required
										/>
										{fields.password.errors && (
											<div
												id={`${fields.password.id}-error`}
												className='text-red-500 text-sm'>
												{fields.password.errors}
											</div>
										)}
									</div>

									<div className='flex flex-col gap-3'>
										<Button
											disabled={fetcher.state === "submitting"}
											type='submit'
											className='w-full'>
											{fetcher.state === "submitting"
												? "Entrando..."
												: "Entrar"}
										</Button>
									</div>
								</div>
							</fetcher.Form>
							<div className='bg-muted relative hidden md:block'>
								<img
									src='/avatars/Marcio.jpg'
									alt='Image'
									className='absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale'
								/>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
