import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

interface ProtectedRouteProps {
    children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { currentUser } = useAppContext();
    const location = useLocation();

    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    return children;
}
