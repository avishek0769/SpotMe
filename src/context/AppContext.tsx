/* eslint-disable react-refresh/only-export-components */
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import * as api from "../api";
import type { UserData } from "../api";

interface AppContextValue {
    user: UserData | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    setUser: (u: UserData | null) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function bootstrapSession() {
            try {
                const res = await api.getCurrentUser();
                setUser(res.data);
            } catch {
                const refreshed = await api.refreshTokens();
                if (!refreshed) {
                    setUser(null);
                    setIsLoading(false);
                    return;
                }

                try {
                    const res = await api.getCurrentUser();
                    setUser(res.data);
                } catch {
                    setUser(null);
                }
            } finally {
                setIsLoading(false);
            }
        }

        void bootstrapSession();
    }, []);

    const loginFn = useCallback(async (email: string, password: string) => {
        await api.login({ email, password });
        const userRes = await api.getCurrentUser();
        setUser(userRes.data);
    }, []);

    const logoutFn = useCallback(async () => {
        await api.logout();
        setUser(null);
    }, []);

    return (
        <AppContext.Provider
            value={{ user, isLoading, login: loginFn, logout: logoutFn, setUser }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useAppContext must be inside AppProvider");
    return ctx;
}
