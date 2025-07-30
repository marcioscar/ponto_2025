
import { prisma } from "~/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "react-router";
import Cookies from "js-cookie";

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

export async function login(email: string, password: string): Promise<User | null> {
  try {
    console.log("Tentando login com email:", email);
    
    // Primeiro, encontra o usuário pelo email
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive' // Case insensitive
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        password: true,
      }
    });

    console.log("Usuário encontrado:", user ? "sim" : "não");

    if (!user) {
      console.log("Usuário não encontrado");
      return null;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log("Senha corresponde:", passwordMatch ? "sim" : "não");

    if (!passwordMatch) {
      return null;
    }

    // Retorna o usuário sem a senha
    const { password: _, ...userWithoutPassword } = user;
    console.log("Login bem-sucedido, retornando usuário:", userWithoutPassword);
    return userWithoutPassword;
  } catch (error) {
    console.error("Erro detalhado ao fazer login:", error);
    return null;
  }
}

export function getAuthenticatedUser(): User | null {
  console.log("getAuthenticatedUser: Função chamada");
  
  try {
    // Verifica se está no servidor
    if (typeof window === 'undefined') {
      console.log("getAuthenticatedUser: executando no servidor, retornando null");
      return null;
    }

    console.log("getAuthenticatedUser: executando no cliente");
    
    // Verifica se Cookies está disponível
    if (!Cookies || typeof Cookies.get !== 'function') {
      console.error("getAuthenticatedUser: Cookies não está disponível");
      return null;
    }

    const storedUser = Cookies.get("user");
    console.log("getAuthenticatedUser: Cookie 'user' raw:", storedUser);
    
    if (!storedUser) {
      console.log("getAuthenticatedUser: Cookie não encontrado");
      return null;
    }

    if (storedUser.trim() === '') {
      console.log("getAuthenticatedUser: Cookie vazio");
      return null;
    }

    const parsedUser = JSON.parse(storedUser);
    console.log("getAuthenticatedUser: Usuário parseado:", parsedUser);
    
    // Valida se tem as propriedades necessárias
    if (!parsedUser.id || !parsedUser.email || !parsedUser.firstName) {
      console.error("getAuthenticatedUser: Dados do usuário inválidos:", parsedUser);
      return null;
    }

    return parsedUser;
  } catch (e) {
    console.error("getAuthenticatedUser: Erro ao parsear usuário dos cookies:", e);
    if (typeof window !== 'undefined') {
      try {
        Cookies.remove("user");
        console.log("getAuthenticatedUser: Cookie removido devido ao erro");
      } catch (removeError) {
        console.error("getAuthenticatedUser: Erro ao remover cookie:", removeError);
      }
    }
    return null;
  }
}

export function requireAuth() {
  const user = getAuthenticatedUser();
  if (!user) {
    throw redirect("/login");
  }
  return user;
}

export function setAuthenticatedUser(user: User) {
  console.log("setAuthenticatedUser: Função chamada com:", user);
  
  try {
    // Verifica se está no servidor
    if (typeof window === 'undefined') {
      console.log("setAuthenticatedUser: executando no servidor, ignorando");
      return;
    }

    console.log("setAuthenticatedUser: executando no cliente");
    
    // Verifica se Cookies está disponível
    if (!Cookies || typeof Cookies.set !== 'function') {
      console.error("setAuthenticatedUser: Cookies não está disponível");
      return;
    }

    const userString = JSON.stringify(user);
    console.log("setAuthenticatedUser: String para salvar:", userString);

    Cookies.set("user", userString, { 
      expires: 7,
      sameSite: 'lax',
      secure: false,
      path: '/'
    });
    
    // Verifica se foi salvo corretamente
    const saved = Cookies.get("user");
    console.log("setAuthenticatedUser: Verificação imediata:", saved);
    
    if (saved === userString) {
      console.log("setAuthenticatedUser: Cookie salvo com sucesso");
    } else {
      console.error("setAuthenticatedUser: Falha ao salvar cookie");
    }
  } catch (error) {
    console.error("setAuthenticatedUser: Erro ao salvar usuário nos cookies:", error);
  }
}

export function removeAuthenticatedUser() {
  try {
    // Verifica se está no servidor
    if (typeof window === 'undefined') {
      return;
    }

    Cookies.remove("user", { path: '/' });
    console.log("removeAuthenticatedUser: Cookie removido");
  } catch (error) {
    console.error("removeAuthenticatedUser: Erro ao remover usuário dos cookies:", error);
  }
}