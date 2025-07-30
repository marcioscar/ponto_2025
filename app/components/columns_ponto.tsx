import type { ColumnDef } from "@tanstack/react-table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
	DialogClose,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Form } from "react-router";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Pencil } from "lucide-react";

// Interface que corresponde ao schema Prisma TimeSheet
interface TimeSheet {
	day: string | null;
	in: Date | null;
	outLunch: Date | null;
	inLunch: Date | null;
	out: Date | null;
}

// Interface estendida que inclui informações do usuário
interface TimeSheetWithUser extends TimeSheet {
	user: {
		id: string;
		firstName: string;
		lastName: string;
	};
}

// Função utilitária para calcular horas trabalhadas
export const calcularHorasTrabalhadas = (
	entrada: Date,
	saida: Date,
	saidaAlmoco?: Date | null,
	voltaAlmoco?: Date | null
): number => {
	if (!entrada || !saida) return 0;

	let horasTrabalhadas = 0;

	if (saidaAlmoco && voltaAlmoco) {
		// Com intervalo de almoço
		const manhaTrabalhada =
			(saidaAlmoco.getTime() - entrada.getTime()) / (1000 * 60 * 60);
		const tardeTrabalhada =
			(saida.getTime() - voltaAlmoco.getTime()) / (1000 * 60 * 60);
		horasTrabalhadas = manhaTrabalhada + tardeTrabalhada;
	} else {
		// Sem intervalo de almoço
		horasTrabalhadas = (saida.getTime() - entrada.getTime()) / (1000 * 60 * 60);
	}

	return Math.max(0, horasTrabalhadas);
};

// Função para formatar horas
export const formatarHoras = (horas: number): string => {
	const horasInteiras = Math.floor(horas);
	const minutos = Math.round((horas - horasInteiras) * 60);
	return `${horasInteiras}h${minutos.toString().padStart(2, "0")}m`;
};

// Função para formatar data/hora para input time
const formatarParaInputTime = (data: Date | null): string => {
	if (!data) return "";
	const date = new Date(data);
	const horas = String(date.getHours()).padStart(2, "0");
	const minutos = String(date.getMinutes()).padStart(2, "0");
	return `${horas}:${minutos}`;
};

// Colunas específicas para timeSheet
export const timeSheetColumns: ColumnDef<TimeSheetWithUser>[] = [
	{
		accessorKey: "day",
		header: "Dia",
		cell: ({ row }) => {
			const timeIn = row.getValue("in") as Date | null;
			if (!timeIn) return "-";
			const dateObj = new Date(timeIn);
			const dia = String(dateObj.getDate()).padStart(2, "0");
			const mes = String(dateObj.getMonth() + 1).padStart(2, "0");
			const ano = dateObj.getFullYear();
			return `${dia}-${mes}-${ano}`;
		},
	},
	{
		accessorKey: "in",
		header: "Entrada",
		cell: ({ row }) => {
			const time = row.getValue("in") as Date;
			if (!time) return "-";

			const horaEntrada = new Date(time);
			const horaFormatada = horaEntrada.toLocaleTimeString("pt-BR", {
				hour: "2-digit",
				minute: "2-digit",
			});

			// Verifica se a hora é maior que 8:00
			const hora = horaEntrada.getHours();
			const minuto = horaEntrada.getMinutes();
			const isAtrasado = hora > 8 || (hora === 8 && minuto > 0);

			return (
				<span className={isAtrasado ? "text-red-600 font-semibold" : ""}>
					{horaFormatada}
				</span>
			);
		},
	},
	{
		accessorKey: "outLunch",
		header: "Saída Almoço",
		cell: ({ row }) => {
			const time = row.getValue("outLunch") as Date;
			return time
				? new Date(time).toLocaleTimeString("pt-BR", {
						hour: "2-digit",
						minute: "2-digit",
				  })
				: "-";
		},
	},
	{
		accessorKey: "inLunch",
		header: "Volta Almoço",
		cell: ({ row }) => {
			const time = row.getValue("inLunch") as Date;
			return time
				? new Date(time).toLocaleTimeString("pt-BR", {
						hour: "2-digit",
						minute: "2-digit",
				  })
				: "-";
		},
	},
	{
		accessorKey: "out",
		header: "Saída",
		cell: ({ row }) => {
			const time = row.getValue("out") as Date;
			return time
				? new Date(time).toLocaleTimeString("pt-BR", {
						hour: "2-digit",
						minute: "2-digit",
				  })
				: "-";
		},
	},
	{
		id: "totalHoras",
		header: "Total Horas",
		cell: ({ row }) => {
			const entrada = row.getValue("in") as Date;
			const saida = row.getValue("out") as Date;
			const saidaAlmoco = row.getValue("outLunch") as Date;
			const voltaAlmoco = row.getValue("inLunch") as Date;

			if (!entrada || !saida) return "-";

			const horas = calcularHorasTrabalhadas(
				entrada,
				saida,
				saidaAlmoco,
				voltaAlmoco
			);
			return formatarHoras(horas);
		},
	},
	{
		accessorKey: "editar",
		header: () => <Pencil className='w-4 h-4 mr-1' />,
		cell: ({ row }) => {
			const pontoData = row.original;
			return (
				<Dialog>
					<DialogTrigger asChild>
						<Button variant='outline' className=' py-2  h-8 '>
							Editar
						</Button>
					</DialogTrigger>
					<DialogContent className=' min-w-[500px] bg-white sm:max-w-[425px]'>
						<DialogHeader>
							<DialogTitle>Editar Ponto</DialogTitle>
							<DialogDescription className='text-blue-700'>
								{pontoData.user?.firstName} - dia{" "}
								{pontoData.day ||
									(pontoData.in
										? new Date(pontoData.in).toLocaleDateString("pt-BR")
										: "N/A")}
							</DialogDescription>
						</DialogHeader>
						<Form method='post'>
							<input
								hidden
								value={pontoData.user?.id || ""}
								name='userId'
								id='userId'
							/>
							<input
								hidden
								value={
									pontoData.in
										? new Date(pontoData.in).getTime().toString()
										: ""
								}
								name='dt'
								id='dt'
							/>
							<input hidden value={pontoData.day || ""} name='day' id='day' />
							<div className='grid gap-4 py-4'>
								<div className='grid grid-cols-4 items-center gap-4'>
									<Label htmlFor='in' className='text-right '>
										Entrada
									</Label>
									<Input
										type='time'
										id='in'
										name='in'
										defaultValue={formatarParaInputTime(pontoData.in)}
										className='col-span-2'
									/>
								</div>
								<div className='grid grid-cols-4 items-center gap-4'>
									<Label htmlFor='outLunch' className='text-right w-full'>
										Saída Almoço
									</Label>
									<Input
										type='time'
										id='outLunch'
										name='outLunch'
										defaultValue={formatarParaInputTime(pontoData.outLunch)}
										className='col-span-2'
									/>
								</div>
								<div className='grid grid-cols-4 items-center gap-4'>
									<Label htmlFor='inLunch' className='  text-nowrap '>
										Entrada Almoço
									</Label>
									<Input
										type='time'
										id='inLunch'
										name='inLunch'
										defaultValue={formatarParaInputTime(pontoData.inLunch)}
										className='  col-span-2'
									/>
								</div>
								<div className='grid grid-cols-4 items-center gap-4'>
									<Label htmlFor='out' className='text-right'>
										Saída
									</Label>
									<Input
										type='time'
										id='out'
										name='out'
										defaultValue={formatarParaInputTime(pontoData.out)}
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
