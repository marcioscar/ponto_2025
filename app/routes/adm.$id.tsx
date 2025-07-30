import type { User } from "@prisma/client";
import { NavLink, redirect } from "react-router";
import { useState, useEffect } from "react";
import { DataTable } from "~/components/data-table_ponto";
import { getUserFromCookies } from "~/lib/session";
import { getUser } from "~/lib/user";
import {
	timeSheetColumns,
	calcularHorasTrabalhadas,
	formatarHoras,
} from "~/components/columns_ponto";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { prisma } from "~/lib/prisma";
import type { Route } from "./+types/adm.$id";
import { toast } from "sonner";

export async function action({ request, params }: Route.ActionArgs) {
	// Verifica se o usuário está autenticado e se é admin
	const user = getUserFromCookies(request);
	if (!user || user.role !== "admin") {
		throw redirect("/login");
	}

	const formData = await request.formData();
	const action = formData.get("_action");

	if (action === "save") {
		const userId = formData.get("userId") as string;
		const dt = formData.get("dt") as string;
		const day = formData.get("day") as string;
		const inTime = formData.get("in") as string;
		const outLunchTime = formData.get("outLunch") as string;
		const inLunchTime = formData.get("inLunch") as string;
		const outTime = formData.get("out") as string;

		if (!userId || !dt) {
			return new Response("Dados inválidos", { status: 400 });
		}

		try {
			// Função para converter string de hora (HH:mm) para Date
			const converterHoraParaDate = (
				dateString: string,
				timeString: string
			): Date | null => {
				// Verifica se o timeString está vazio ou inválido
				if (!timeString || timeString.trim() === "") {
					return null;
				}

				// Valida o formato HH:mm
				const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
				if (!timeRegex.test(timeString)) {
					return null;
				}

				// Verifica se dateString é timestamp ou string e converte adequadamente
				let originalDate: Date;
				if (!isNaN(Number(dateString))) {
					// É um timestamp em milissegundos
					originalDate = new Date(Number(dateString));
				} else {
					// É uma string de data
					originalDate = new Date(dateString);
				}

				if (isNaN(originalDate.getTime())) {
					return null;
				}

				// Converte a string de hora para números
				const [hours, minutes] = timeString.split(":").map(Number);

				// Verifica se os números são válidos
				if (
					isNaN(hours) ||
					isNaN(minutes) ||
					hours < 0 ||
					hours > 23 ||
					minutes < 0 ||
					minutes > 59
				) {
					return null;
				}

				// Cria a nova data
				const newDate = new Date(originalDate);
				newDate.setHours(hours, minutes, 0, 0);

				// Verifica se o Date object resultante é válido
				if (isNaN(newDate.getTime())) {
					return null;
				}

				return newDate;
			};

			// Converte os horários - trata strings vazias como null

			const novaEntrada =
				inTime && inTime.trim() !== ""
					? converterHoraParaDate(dt, inTime)
					: null;

			const novaSaidaAlmoco =
				outLunchTime && outLunchTime.trim() !== ""
					? converterHoraParaDate(dt, outLunchTime)
					: null;

			const novaVoltaAlmoco =
				inLunchTime && inLunchTime.trim() !== ""
					? converterHoraParaDate(dt, inLunchTime)
					: null;

			const novaSaida =
				outTime && outTime.trim() !== ""
					? converterHoraParaDate(dt, outTime)
					: null;

			// Busca o usuário e encontra o registro de ponto específico
			const userWithTimeSheet = await prisma.user.findUnique({
				where: { id: userId },
				select: {
					id: true,
					timeSheet: true,
				},
			});

			if (!userWithTimeSheet) {
				return new Response("Usuário não encontrado", { status: 404 });
			}

			// Melhor lógica para encontrar o registro específico
			// Usa timestamp em milissegundos para comparação exata
			const targetTimestamp = parseInt(dt);
			const timeSheetIndex = userWithTimeSheet.timeSheet.findIndex(
				(ponto, index) => {
					if (!ponto.in) return false;

					const pontoTimestamp = new Date(ponto.in).getTime();

					return pontoTimestamp === targetTimestamp;
				}
			);

			if (timeSheetIndex === -1) {
				return new Response("Registro de ponto não encontrado", {
					status: 404,
				});
			}

			// Atualiza o registro específico
			const updatedTimeSheet = [...userWithTimeSheet.timeSheet];

			// IMPORTANTE: Criar cópia do registro original ANTES de qualquer modificação
			const registroOriginal = { ...updatedTimeSheet[timeSheetIndex] };

			updatedTimeSheet[timeSheetIndex] = {
				...registroOriginal,
				day: day || registroOriginal.day,
				// Se campo não está vazio, usa novo valor, senão preserva original
				in: inTime && inTime.trim() !== "" ? novaEntrada : registroOriginal.in,
				outLunch:
					outLunchTime && outLunchTime.trim() !== ""
						? novaSaidaAlmoco
						: registroOriginal.outLunch,
				inLunch:
					inLunchTime && inLunchTime.trim() !== ""
						? novaVoltaAlmoco
						: registroOriginal.inLunch,
				out:
					outTime && outTime.trim() !== "" ? novaSaida : registroOriginal.out,
			};

			// Validação final antes de salvar no banco
			const registroParaAtualizar = updatedTimeSheet[timeSheetIndex];

			// Verifica se todas as datas são válidas
			const datasParaValidar = [
				{ nome: "in", data: registroParaAtualizar.in },
				{ nome: "outLunch", data: registroParaAtualizar.outLunch },
				{ nome: "inLunch", data: registroParaAtualizar.inLunch },
				{ nome: "out", data: registroParaAtualizar.out },
			];

			for (const { nome, data } of datasParaValidar) {
				if (
					data !== null &&
					(!(data instanceof Date) || isNaN(data.getTime()))
				) {
					console.error(`Data inválida encontrada no campo ${nome}:`, data);
					return new Response(`Erro: Data inválida no campo ${nome}`, {
						status: 400,
					});
				}
			}

			// Atualiza no banco de dados
			await prisma.user.update({
				where: { id: userId },
				data: {
					timeSheet: updatedTimeSheet,
				},
			});

			// Redireciona de volta para a página com uma mensagem de sucesso
			return redirect(`/adm/${userId}?success=ponto-atualizado`);
		} catch (error) {
			console.error("Erro ao atualizar ponto:", error);
			return new Response("Erro interno do servidor", { status: 500 });
		}
	}

	return new Response("Ação não reconhecida", { status: 400 });
}

export async function loader({
	request,
	params,
}: {
	request: Request;
	params: any;
}) {
	// Verifica se o usuário está autenticado e se é admin
	const user = getUserFromCookies(request);
	if (!user || user.role !== "admin") {
		throw redirect("/login");
	}

	// Busca o usuário específico
	const { id } = params;
	const user_ponto = await getUser(id as string);

	if (!user_ponto) {
		throw redirect("/adm");
	}

	// Verifica se há mensagem de sucesso na URL
	const url = new URL(request.url);
	const success = url.searchParams.get("success");

	return { user, user_ponto, success };
}

export default function Adm({
	loaderData,
}: {
	loaderData: { user_ponto: User; user: User; success?: string };
}) {
	const { user_ponto, user, success } = loaderData;

	// Mostra toast de sucesso quando há parâmetro success
	useEffect(() => {
		if (success === "ponto-atualizado") {
			toast.success("Ponto atualizado com sucesso!", {
				description: "As alterações foram salvas no sistema.",
				duration: 4000,
			});
		}
	}, [success]);

	// Estado para filtros de mês e ano
	const agora = new Date();
	const [mesSelecionado, setMesSelecionado] = useState(
		String(agora.getMonth() + 1)
	);
	const [anoSelecionado, setAnoSelecionado] = useState(
		String(agora.getFullYear())
	);

	// Arrays de meses e anos
	const meses = [
		{ valor: "1", nome: "Janeiro" },
		{ valor: "2", nome: "Fevereiro" },
		{ valor: "3", nome: "Março" },
		{ valor: "4", nome: "Abril" },
		{ valor: "5", nome: "Maio" },
		{ valor: "6", nome: "Junho" },
		{ valor: "7", nome: "Julho" },
		{ valor: "8", nome: "Agosto" },
		{ valor: "9", nome: "Setembro" },
		{ valor: "10", nome: "Outubro" },
		{ valor: "11", nome: "Novembro" },
		{ valor: "12", nome: "Dezembro" },
	];

	// Anos disponíveis (últimos 3 anos + próximos 2 anos)
	const anosDisponiveis = [];
	for (let i = agora.getFullYear() - 3; i <= agora.getFullYear() + 2; i++) {
		anosDisponiveis.push(String(i));
	}

	// Prepara os dados do timeSheet para exibição na tabela
	const timeSheetData = user_ponto.timeSheet || [];

	// Filtra os dados por mês e ano selecionados e adiciona informações do usuário
	const dadosFiltrados = timeSheetData
		.filter((ponto) => {
			if (!ponto.in) return false;
			const dataPonto = new Date(ponto.in);
			return (
				dataPonto.getMonth() + 1 === Number(mesSelecionado) &&
				dataPonto.getFullYear() === Number(anoSelecionado)
			);
		})
		.map((ponto) => ({
			...ponto,
			user: {
				id: user_ponto.id,
				firstName: user_ponto.firstName,
				lastName: user_ponto.lastName,
			},
		}));

	// Calcula total de horas do mês
	const totalHorasMes = dadosFiltrados.reduce((total, ponto) => {
		if (!ponto.in || !ponto.out) return total;
		const entrada = new Date(ponto.in);
		const saida = new Date(ponto.out);
		const saidaAlmoco = ponto.outLunch ? new Date(ponto.outLunch) : null;
		const voltaAlmoco = ponto.inLunch ? new Date(ponto.inLunch) : null;

		return (
			total + calcularHorasTrabalhadas(entrada, saida, saidaAlmoco, voltaAlmoco)
		);
	}, 0);

	return (
		<div className='container mx-auto p-6'>
			<div className='flex items-center justify-between'>
				<div className='mb-6'>
					<h1 className='text-2xl font-bold'>
						Ponto de {user_ponto.firstName} {user_ponto.lastName}
					</h1>
					<p className='text-gray-600'>{user_ponto.email}</p>
				</div>

				{/* Filtros de Mês e Ano */}
				<div className='mb-6 flex gap-4 items-center'>
					<div className='flex flex-col'>
						<label className='text-sm font-medium mb-1'>Mês:</label>
						<Select value={mesSelecionado} onValueChange={setMesSelecionado}>
							<SelectTrigger className='w-[180px]'>
								<SelectValue placeholder='Selecione o mês' />
							</SelectTrigger>
							<SelectContent>
								{meses.map((mes) => (
									<SelectItem key={mes.valor} value={mes.valor}>
										{mes.nome}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className='flex flex-col'>
						<label className='text-sm font-medium mb-1'>Ano:</label>
						<Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
							<SelectTrigger className='w-[120px]'>
								<SelectValue placeholder='Selecione o ano' />
							</SelectTrigger>
							<SelectContent>
								{anosDisponiveis.map((ano) => (
									<SelectItem key={ano} value={ano}>
										{ano}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className='mt-6 space-y-1'>
						<div className='text-sm text-gray-600'>
							{dadosFiltrados.length} registro(s) encontrado(s)
						</div>
						<div className='text-lg font-semibold text-blue-600'>
							Total: {formatarHoras(totalHorasMes)}
						</div>
					</div>
					<NavLink
						className=' print:hidden rounded-md bg-blue-500  text-white px-2 py-1 transition duration-300 ease-in-out hover:bg-yellow-400 hover:-translate-y-1'
						to='/adm'
						end>
						Voltar
					</NavLink>
				</div>
			</div>
			{dadosFiltrados.length > 0 ? (
				<DataTable columns={timeSheetColumns} data={dadosFiltrados} />
			) : (
				<div className='text-center py-8'>
					<p className='text-gray-500'>
						Nenhum registro de ponto encontrado para{" "}
						{meses.find((m) => m.valor === mesSelecionado)?.nome} de{" "}
						{anoSelecionado}.
					</p>
				</div>
			)}
		</div>
	);
}
