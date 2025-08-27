import { Navigate } from "react-router-dom";
import { usePlan } from "@/context/PlanContext";

const ProtectedRoute = ({ children, requiredRoles, requiredPlans }) => {
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
    const hasRole = user.type === 'admin' && requiredRoles.includes('admin') ||
                   user.type === 'sub_user' && requiredRoles.includes(user.role);
    
    if (!hasRole) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
