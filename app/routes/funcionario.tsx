import { LogOut, Calendar, Clock, Timer } from "lucide-react";
import { Form, useSearchParams } from "react-router";
import {
	timeSheetColumns,
	formatarHoras,
	calcularHorasTrabalhadas,
} from "~/components/columns_ponto_funcionario";
import { DataTable } from "~/components/data-table_ponto";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { Route } from "./+types/funcionario";
import { toast } from "sonner";
import { useEffect } from "react";
import { funcionarioLoader, funcionarioAction } from "./funcionario.server";
import { determinarProximoPonto, type ProximoPonto } from "~/lib/client-utils";

export const loader = funcionarioLoader;
export const action = funcionarioAction;

export default function Funcionario({ loaderData }: Route.ComponentProps) {
	const { user, success, error } = loaderData;
	const [searchParams] = useSearchParams();

	// Mostra toasts baseado nos parâmetros da URL
	useEffect(() => {
		if (success) {
			toast.success(success);
		}
		if (error) {
			toast.error(error);
		}
	}, [success, error]);

	// Data atual
	const hoje = new Date();

	// Filtra pontos do dia de hoje (para status atual e bater ponto)
	const inicioDoHoje = new Date(
		hoje.getFullYear(),
		hoje.getMonth(),
		hoje.getDate()
	);
	const fimDoHoje = new Date(
		hoje.getFullYear(),
		hoje.getMonth(),
		hoje.getDate(),
		23,
		59,
		59
	);

	const pontosDeHoje = (user.timeSheet || []).filter((ponto) => {
		if (!ponto.in) return false;
		const dataPonto = new Date(ponto.in);
		return dataPonto >= inicioDoHoje && dataPonto <= fimDoHoje;
	});

	// Filtra pontos do mês atual (para tabela e total de horas)
	const inicioDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
	const fimDoMes = new Date(
		hoje.getFullYear(),
		hoje.getMonth() + 1,
		0,
		23,
		59,
		59
	);

	const pontosMesAtual = (user.timeSheet || [])
		.filter((ponto) => {
			if (!ponto.in) return false;
			const dataPonto = new Date(ponto.in);
			return dataPonto >= inicioDoMes && dataPonto <= fimDoMes;
		})
		.map((ponto) => ({
			...ponto,
			user: {
				id: user.id,
				firstName: user.firstName,
				lastName: user.lastName,
			},
		}))
		.sort((a, b) => {
			// Ordena por data decrescente (mais recente primeiro)
			if (!a.in || !b.in) return 0;
			return new Date(b.in).getTime() - new Date(a.in).getTime();
		});

	// Calcula total de horas do mês
	const totalHorasMes = pontosMesAtual.reduce((total, ponto) => {
		if (!ponto.in || !ponto.out) return total;
		const entrada = new Date(ponto.in);
		const saida = new Date(ponto.out);
		const saidaAlmoco = ponto.outLunch ? new Date(ponto.outLunch) : null;
		const voltaAlmoco = ponto.inLunch ? new Date(ponto.inLunch) : null;

		return (
			total + calcularHorasTrabalhadas(entrada, saida, saidaAlmoco, voltaAlmoco)
		);
	}, 0);

	// Determina o próximo ponto a ser batido (baseado apenas no dia de hoje)
	const proximoPonto = determinarProximoPonto(user.id, user.timeSheet || []);

	// Obter o último ponto registrado do dia de hoje
	const ultimoPontoHoje = pontosDeHoje.length > 0 ? pontosDeHoje[0] : null;

	// Nome do mês atual
	const nomeMesAtual = hoje.toLocaleDateString("pt-BR", {
		month: "long",
		year: "numeric",
	});

	return (
		<div className='min-h-screen bg-gray-50'>
			{/* Header */}
			<div className='flex items-center justify-between w-full mx-auto px-8 py-4 bg-white shadow-sm'>
				<div className='flex items-center gap-4'>
					<Avatar className='h-10 w-10 rounded-lg'>
						<AvatarImage
							src={"/avatars/" + user.firstName + ".jpg"}
							alt={user.firstName}
						/>
						<AvatarFallback className='rounded-lg'>
							{user.firstName.charAt(0) + user.lastName.charAt(0)}
						</AvatarFallback>
					</Avatar>
					<div className='grid text-left text-sm leading-tight'>
						<span className='font-medium text-lg'>
							{user.firstName} {user.lastName}
						</span>
						<span className='text-xs text-gray-600'>{user.email}</span>
					</div>
				</div>
				<Form action='/logout' method='post'>
					<Button type='submit' variant='outline'>
						<LogOut className='w-4 h-4 mr-2' />
						Sair
					</Button>
				</Form>
			</div>

			{/* Conteúdo Principal */}
			<div className='container mx-auto p-6'>
				{/* Cards de Resumo */}
				<div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>
								Data de Hoje
							</CardTitle>
							<Calendar className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-lg font-bold'>
								{hoje.toLocaleDateString("pt-BR")}
							</div>
							<p className='text-xs text-muted-foreground'>
								{hoje.toLocaleDateString("pt-BR", { weekday: "long" })}
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>
								Total de Horas do Mês
							</CardTitle>
							<Clock className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-xl font-bold'>
								{totalHorasMes > 0 ? formatarHoras(totalHorasMes) : "0h00m"}
							</div>
							<p className='text-xs text-muted-foreground'>
								Trabalhadas em {nomeMesAtual}
							</p>
						</CardContent>
					</Card>

					{/* Card do Bater Ponto */}
					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Bater Ponto</CardTitle>
							<Timer className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<Form method='post'>
								<input type='hidden' name='_action' value='bater-ponto' />
								<input
									type='hidden'
									name='tipoPonto'
									value={proximoPonto.tipo}
								/>
								<Button
									type='submit'
									disabled={proximoPonto.disabled}
									className={`w-full ${
										proximoPonto.disabled
											? "bg-gray-400"
											: "bg-blue-600 hover:bg-blue-700"
									}`}>
									{proximoPonto.label}
								</Button>
							</Form>
							<p className='text-xs text-muted-foreground mt-2'>
								{hoje.toLocaleTimeString("pt-BR", {
									hour: "2-digit",
									minute: "2-digit",
								})}
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Status do Ponto Atual (apenas do dia de hoje) */}
				{ultimoPontoHoje && (
					<Card className='mb-8'>
						<CardHeader>
							<CardTitle>Status do Ponto de Hoje</CardTitle>
							<p className='text-sm text-muted-foreground'>
								Registros do dia {hoje.toLocaleDateString("pt-BR")}
							</p>
						</CardHeader>
						<CardContent>
							<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
								<div className='text-center'>
									<p className='text-sm text-muted-foreground'>Entrada</p>
									<p className='text-lg font-semibold'>
										{ultimoPontoHoje.in
											? new Date(ultimoPontoHoje.in).toLocaleTimeString(
													"pt-BR",
													{ hour: "2-digit", minute: "2-digit" }
											  )
											: "---"}
									</p>
								</div>
								<div className='text-center'>
									<p className='text-sm text-muted-foreground'>Saída Almoço</p>
									<p className='text-lg font-semibold'>
										{ultimoPontoHoje.outLunch
											? new Date(ultimoPontoHoje.outLunch).toLocaleTimeString(
													"pt-BR",
													{ hour: "2-digit", minute: "2-digit" }
											  )
											: "---"}
									</p>
								</div>
								<div className='text-center'>
									<p className='text-sm text-muted-foreground'>Volta Almoço</p>
									<p className='text-lg font-semibold'>
										{ultimoPontoHoje.inLunch
											? new Date(ultimoPontoHoje.inLunch).toLocaleTimeString(
													"pt-BR",
													{ hour: "2-digit", minute: "2-digit" }
											  )
											: "---"}
									</p>
								</div>
								<div className='text-center'>
									<p className='text-sm text-muted-foreground'>Saída</p>
									<p className='text-lg font-semibold'>
										{ultimoPontoHoje.out
											? new Date(ultimoPontoHoje.out).toLocaleTimeString(
													"pt-BR",
													{ hour: "2-digit", minute: "2-digit" }
											  )
											: "---"}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Tabela de Pontos do Mês */}
				<Card>
					<CardHeader>
						<CardTitle>Meus Pontos - {nomeMesAtual}</CardTitle>
						<p className='text-sm text-muted-foreground'>
							Visualize todos os seus registros de ponto do mês atual
						</p>
					</CardHeader>
					<CardContent>
						{pontosMesAtual.length > 0 ? (
							<DataTable columns={timeSheetColumns} data={pontosMesAtual} />
						) : (
							<div className='text-center py-12'>
								<Clock className='h-12 w-12 text-gray-300 mx-auto mb-4' />
								<h3 className='text-lg font-medium text-gray-900 mb-2'>
									Nenhum ponto registrado este mês
								</h3>
								<p className='text-gray-500'>
									Use o botão "Bater Ponto" acima para registrar sua entrada.
								</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
