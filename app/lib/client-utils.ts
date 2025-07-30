// Funções utilitárias que são seguras para usar no cliente
// (não contêm código do servidor/Prisma)

export type TipoPonto = "entrada" | "saida_almoco" | "volta_almoco" | "saida";

export interface ProximoPonto {
  tipo: TipoPonto;
  label: string;
  disabled: boolean;
}

// Função para determinar o próximo ponto a ser batido
export const determinarProximoPonto = (userId: string, timeSheet: any[]): ProximoPonto => {
  // Filtra pontos do dia de hoje
  const hoje = new Date();
  const inicioDoHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const fimDoHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);

  const pontoDeHoje = timeSheet.find((ponto) => {
    if (!ponto.in) return false;
    const dataPonto = new Date(ponto.in);
    return dataPonto >= inicioDoHoje && dataPonto <= fimDoHoje;
  });

  if (!pontoDeHoje) {
    return { tipo: "entrada", label: "Bater Entrada", disabled: false };
  }

  // Verifica qual é o próximo ponto baseado no que já foi registrado
  if (!pontoDeHoje.in) {
    return { tipo: "entrada", label: "Bater Entrada", disabled: false };
  }
  
  if (!pontoDeHoje.outLunch) {
    return { tipo: "saida_almoco", label: "Saída Almoço", disabled: false };
  }
  
  if (!pontoDeHoje.inLunch) {
    return { tipo: "volta_almoco", label: "Volta Almoço", disabled: false };
  }
  
  if (!pontoDeHoje.out) {
    return { tipo: "saida", label: "Bater Saída", disabled: false };
  }

  // Todos os pontos já foram batidos
  return { tipo: "entrada", label: "Ponto Completo", disabled: true };
}; 