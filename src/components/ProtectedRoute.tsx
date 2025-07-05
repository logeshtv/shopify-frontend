import { Navigate } from "react-router-dom";
import { usePlan } from "@/context/PlanContext";

const ProtectedRoute = ({
  children,
  requiredRoles,
  requiredPlans,
}: {
  children: JSX.Element;
  requiredRoles?: string[];
  requiredPlans?: string[]; // array of allowed priceIds
}) => {
  const isLoggedIn = !!localStorage.getItem("user_email");
  const userType = localStorage.getItem("user_type");
  const userRole = (localStorage.getItem("user_role") || "").toLowerCase();
  const { priceId, loading } = usePlan();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (loading) return null; // or a spinner

  // Plan-based protection
  if (requiredPlans && !requiredPlans.includes(priceId)) {
    return <Navigate to="/billing" replace />;
  }

  // Role-based protection (existing logic)
  if (requiredRoles) {
    if (userType === "admin" && requiredRoles.includes("admin")) {
      // Admin is allowed
    } else if (
      userType === "sub_user" &&
      userRole &&
      requiredRoles.includes(userRole)
    ) {
      // Sub-user with allowed role
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }
  return children;
};

export default ProtectedRoute;
