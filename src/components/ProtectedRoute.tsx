import { Navigate } from "react-router-dom";
import { usePlan } from "@/context/PlanContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPlans?: string[];
}

const ProtectedRoute = ({ children, requiredRoles, requiredPlans }: ProtectedRouteProps) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { priceId, loading } = usePlan();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (loading) return null;

  if (requiredPlans && !requiredPlans.includes(priceId)) {
    return <Navigate to="/billing" replace />;
  }

  if (requiredRoles) {
    const userRole = user.role?.toLowerCase();
    const hasRole = user.type === 'admin' || 
                   (user.type === 'sub_user' && requiredRoles.includes(userRole));
    
    if (!hasRole) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
