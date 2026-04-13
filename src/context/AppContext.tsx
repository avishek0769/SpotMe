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
    const [user, setUser] = useState<UserData | null>(() => api.getStoredUser());
    const [isLoading, setIsLoading] = useState(() => Boolean(api.getStoredUser()));

    useEffect(() => {
        const stored = api.getStoredUser();
        if (!stored) {
            return;
        }
        api.getCurrentUser()
            .then((res) => { setUser(res.data); })
            .catch(() => {
                localStorage.removeItem("spotme.accessToken");
                localStorage.removeItem("spotme.refreshToken");
                localStorage.removeItem("spotme.user");
                setUser(null);
            })
            .finally(() => setIsLoading(false));
    }, []);

    const loginFn = useCallback(async (email: string, password: string) => {
        const res = await api.login({ email, password });
        setUser(res.data);
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
