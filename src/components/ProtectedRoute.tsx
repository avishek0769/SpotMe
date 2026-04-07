import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

interface ProtectedRouteProps {
    children: ReactNode;
}

const AUTH_DISABLED_FOR_NOW = true;

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { currentUser } = useAppContext();
    const location = useLocation();

    if (AUTH_DISABLED_FOR_NOW) {
        return children;
    }

    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    return children;
}
