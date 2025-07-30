import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
	getAuthenticatedUser,
	setAuthenticatedUser,
	removeAuthenticatedUser,
	type User,
} from "~/lib/auth";

type AuthContextType = {
	user: User | null;
	login: (user: User) => void;
	logout: () => void;
	isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	console.log("AuthProvider: Componente sendo renderizado");

	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();

	console.log(
		"AuthProvider: Estado atual - user:",
		user,
		"isLoading:",
		isLoading
	);

	useEffect(() => {
		console.log("AuthProvider: useEffect executando");
		console.log("AuthProvider: Inicializando contexto de autenticação");

		// Executa imediatamente sem timeout
		try {
			console.log("AuthProvider: Verificando usuário nos cookies");
			const storedUser = getAuthenticatedUser();
			console.log("AuthProvider: Usuário recuperado dos cookies:", storedUser);

			if (storedUser) {
				console.log("AuthProvider: Definindo usuário no estado:", storedUser);
				setUser(storedUser);
			} else {
				console.log("AuthProvider: Nenhum usuário encontrado nos cookies");
			}
		} catch (error) {
			console.error("AuthProvider: Erro ao carregar usuário:", error);
		}

		console.log("AuthProvider: Inicialização concluída");
	}, []);

	const loginUser = (userData: User) => {
		console.log("AuthProvider: loginUser chamado com:", userData);
		console.log("AuthProvider: Executando login com usuário:", userData);

		// Primeiro atualiza o estado
		console.log("AuthProvider: Atualizando estado local");
		setUser(userData);
		console.log("AuthProvider: Estado do usuário atualizado para:", userData);

		// Depois salva nos cookies
		console.log("AuthProvider: Chamando setAuthenticatedUser");
		setAuthenticatedUser(userData);
		console.log("AuthProvider: setAuthenticatedUser concluído");

		// Verifica se foi salvo
		setTimeout(() => {
			const saved = getAuthenticatedUser();
			console.log("AuthProvider: Verificação após salvar:", saved);

			// Redireciona imediatamente
			console.log("AuthProvider: Redirecionando para home");
			window.location.href = "/";
		}, 50);
	};

	const logoutUser = () => {
		console.log("AuthProvider: Executando logout");
		setUser(null);
		removeAuthenticatedUser();
		navigate("/login");
	};

	const contextValue = {
		user,
		login: loginUser,
		logout: logoutUser,
		isLoading,
	};
	console.log("AuthProvider: Valor do contexto:", contextValue);

	return (
		<AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
	);
}

export function useAuth() {
	console.log("useAuth: Hook sendo chamado");
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth deve ser usado dentro de um AuthProvider");
	}
	console.log("useAuth: Retornando contexto:", context);
	return context;
}
