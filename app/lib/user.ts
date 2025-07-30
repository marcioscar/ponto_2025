import { prisma } from "~/lib/prisma";

export const getUsers = async () => {
    
  return prisma.user.findMany({
    where: {
      role: { not: 'admin' },
    },
    orderBy: {
      firstName: "asc",
    },
  });
};

export const getUser = async (id: string) => {
  return prisma.user.findUnique({
    where: {
      id: id,
    },
  });
};

export const createUser = async (user: any) => {
  return prisma.user.create({
    data: user,
  });
};

// Tipos para o sistema de ponto
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

// Função para bater ponto
export const baterPonto = async (userId: string, tipoPonto: TipoPonto): Promise<{ success: boolean; message: string }> => {
  try {
    // Busca o usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        timeSheet: true,
      },
    });

    if (!user) {
      return { success: false, message: "Usuário não encontrado" };
    }

    const agora = new Date();
    const hoje = new Date();
    const inicioDoHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const fimDoHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);

    // Procura por um registro do dia de hoje
    let pontoHojeIndex = user.timeSheet.findIndex((ponto) => {
      if (!ponto.in) return false;
      const dataPonto = new Date(ponto.in);
      return dataPonto >= inicioDoHoje && dataPonto <= fimDoHoje;
    });

    let novoTimeSheet = [...user.timeSheet];

    if (pontoHojeIndex === -1) {
      // Não existe registro para hoje, cria um novo se for entrada
      if (tipoPonto === "entrada") {
        const novoPonto = {
          day: agora.toISOString().split('T')[0], // YYYY-MM-DD
          in: agora,
          outLunch: null,
          inLunch: null,
          out: null,
        };
        novoTimeSheet.push(novoPonto);
      } else {
        return { success: false, message: "Você deve primeiro bater a entrada" };
      }
    } else {
      // Atualiza o registro existente
      const pontoExistente = { ...novoTimeSheet[pontoHojeIndex] };

      switch (tipoPonto) {
        case "entrada":
          if (pontoExistente.in) {
            return { success: false, message: "Entrada já foi registrada hoje" };
          }
          pontoExistente.in = agora;
          break;

        case "saida_almoco":
          if (!pontoExistente.in) {
            return { success: false, message: "Você deve primeiro bater a entrada" };
          }
          if (pontoExistente.outLunch) {
            return { success: false, message: "Saída para almoço já foi registrada" };
          }
          pontoExistente.outLunch = agora;
          break;

        case "volta_almoco":
          if (!pontoExistente.outLunch) {
            return { success: false, message: "Você deve primeiro registrar a saída para almoço" };
          }
          if (pontoExistente.inLunch) {
            return { success: false, message: "Volta do almoço já foi registrada" };
          }
          pontoExistente.inLunch = agora;
          break;

        case "saida":
          if (!pontoExistente.in) {
            return { success: false, message: "Você deve primeiro bater a entrada" };
          }
          if (pontoExistente.out) {
            return { success: false, message: "Saída já foi registrada hoje" };
          }
          pontoExistente.out = agora;
          break;

        default:
          return { success: false, message: "Tipo de ponto inválido" };
      }

      novoTimeSheet[pontoHojeIndex] = pontoExistente;
    }

    // Atualiza no banco de dados
    await prisma.user.update({
      where: { id: userId },
      data: {
        timeSheet: novoTimeSheet,
      },
    });

    const labels = {
      entrada: "Entrada",
      saida_almoco: "Saída para Almoço",
      volta_almoco: "Volta do Almoço",
      saida: "Saída"
    };

    return { 
      success: true, 
      message: `${labels[tipoPonto]} registrada com sucesso às ${agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` 
    };

  } catch (error) {
    console.error("Erro ao bater ponto:", error);
    return { success: false, message: "Erro interno do servidor" };
  }
};