import { useAuth } from "@/context/AuthContext";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
    component: React.ComponentType<any>;
    adminOnly?: boolean;
}

export function ProtectedRoute({ component: Component, adminOnly = false }: ProtectedRouteProps) {
    const { user, isAuthenticated } = useAuth();

    // We might want a loading state in AuthContext to prevent premature redirect
    // For now assuming user is loaded quickly from localStorage or null

    if (!isAuthenticated && !localStorage.getItem("token")) {
        return <Redirect to="/login" />;
    }

    if (adminOnly && user && user.role !== "ADMIN") {
        return <Redirect to="/" />;
    }

    // If we have token (in storage) but user is null (async load), show loader
    if (!user) {
        return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return <Component />;
}
