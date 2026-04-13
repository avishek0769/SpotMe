import { Navigate, Route, Routes } from "react-router-dom";
import { AppProvider } from "./context/AppContext.tsx";
import { AppShell } from "./components/AppShell.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import { AuthPage } from "./pages/AuthPage.tsx";
import { DashboardPage } from "./pages/DashboardPage.tsx";
import { EventManagementPage } from "./pages/EventManagementPage.tsx";
import { GuestEventPage } from "./pages/GuestEventPage.tsx";
import { GuestCollectionPage } from "./pages/GuestCollectionPage.tsx";
import { LandingPage } from "./pages/LandingPage.tsx";
import { NotFoundPage } from "./pages/NotFoundPage.tsx";

function App() {
    return (
        <AppProvider>
            <AppShell>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route
                        path="/signup"
                        element={<AuthPage mode="signup" />}
                    />
                    <Route path="/login" element={<AuthPage mode="login" />} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <DashboardPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/events/:id"
                        element={
                            <ProtectedRoute>
                                <EventManagementPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/events/:id/guest"
                        element={<GuestEventPage />}
                    />
                    <Route
                        path="/events/:id/guest/collection"
                        element={<GuestCollectionPage />}
                    />
                    <Route path="*" element={<NotFoundPage />} />
                    <Route path="/home" element={<Navigate to="/" replace />} />
                </Routes>
            </AppShell>
        </AppProvider>
    );
}

export default App;
