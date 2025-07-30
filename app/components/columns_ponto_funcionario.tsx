import type { ColumnDef } from "@tanstack/react-table";

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

// Colunas específicas para visualização do funcionário (sem edição)
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
];
