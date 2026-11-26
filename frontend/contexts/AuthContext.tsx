
"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import auth from "@/services/auth";

interface User {
    id: number;
    name: string;
    email: string;
    role: "admin" | "mahasiswa" | "dosen";
    nim?: string | null;
    nip?: string | null;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (credentials: {
        email: string;
        password: string;
        turnstile_token: string;
    }) => Promise<User>;
    register: (data: {
        name: string;
        email: string;
        password: string;
        password_confirmation: string;
        role: "mahasiswa" | "dosen";
        nim?: string;
        nip?: string;
        turnstile_token: string;
    }) => Promise<User>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        try {
            if (!auth.getToken()) {
                setUser(null);
                return;
            }

            const currentUser = await auth.getUser();
            setUser(currentUser);
        } catch (error: any) {
            if (error.response?.status === 401) {
                localStorage.removeItem("auth_token");
                setUser(null);
            }
        }
    };

    useEffect(() => {
        const initializeAuth = async () => {
            await refreshUser();
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const login = async (credentials: {
        email: string;
        password: string;
        turnstile_token: string;
    }) => {
        const loggedInUser = await auth.login(credentials);
        setUser(loggedInUser);
        return loggedInUser;
    };

    const register = async (data: {
        name: string;
        email: string;
        password: string;
        password_confirmation: string;
        role: "mahasiswa" | "dosen";
        nim?: string;
        nip?: string;
        turnstile_token: string;
    }) => {
        const registeredUser = await auth.register(data);
        setUser(registeredUser);
        return registeredUser;
    };

    const logout = async () => {
        setUser(null);
        await auth.logout();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth harus digunakan di dalam AuthProvider");
    }

    return context;
}
