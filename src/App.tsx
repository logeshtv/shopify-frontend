import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import HSCodes from "./pages/HSCodes";
import Documents from "./pages/Documents";
import LandedCost from "./pages/LandedCost";
import ESG from "./pages/ESG";
import Billing from "./pages/Billing";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import { PlanProvider } from "@/context/PlanContext";
import LandedCostHistory from "./pages/LandedCostHistory";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PlanProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager"]}>
                  <Products />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hs-codes"
              element={
                <ProtectedRoute
                  requiredRoles={["admin", "manager", "analyst"]}
                  requiredPlans={[
                    "price_1RcnoUQiUhrwJo9CamPZGsh1",
                    "price_1RcnosQiUhrwJo9CzIMCgiea",
                    "price_1RcnpzQiUhrwJo9CVz7Wsug6",
                    "price_1RcnqKQiUhrwJo9CCdhvD8Ep",
                  ]}
                >
                  <HSCodes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents"
              element={
                <ProtectedRoute
                  requiredRoles={["admin", "manager", "analyst", "viewer"]}
                  requiredPlans={[
                    "price_1RcnoUQiUhrwJo9CamPZGsh1",
                    "price_1RcnosQiUhrwJo9CzIMCgiea",
                    "price_1RcnpzQiUhrwJo9CVz7Wsug6",
                    "price_1RcnqKQiUhrwJo9CCdhvD8Ep",
                  ]}
                >
                  <Documents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/landed-cost"
              element={
                <ProtectedRoute
                  requiredRoles={["admin", "manager"]}
                  requiredPlans={[
                    "price_1RcnpzQiUhrwJo9CVz7Wsug6",
                    "price_1RcnqKQiUhrwJo9CCdhvD8Ep",
                  ]}
                >
                  <LandedCost />
                </ProtectedRoute>
              }
            />
            <Route
              path="/landed-cost-history"
              element={
                <ProtectedRoute
                  requiredRoles={["admin", "manager"]}
                  requiredPlans={[
                    "price_1RcnpzQiUhrwJo9CVz7Wsug6",
                    "price_1RcnqKQiUhrwJo9CCdhvD8Ep",
                  ]}
                >
                  <LandedCostHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/esg"
              element={
                <ProtectedRoute
                  requiredRoles={["admin", "manager", "analyst"]}
                  requiredPlans={[
                    "price_1RcnpzQiUhrwJo9CVz7Wsug6",
                    "price_1RcnqKQiUhrwJo9CCdhvD8Ep",
                  ]}
                >
                  <ESG />
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing"
              element={
                <ProtectedRoute requiredRoles={["admin"]}>
                  <Billing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute
                  requiredRoles={["admin"]}
                  requiredPlans={[
                    "price_1RcnoUQiUhrwJo9CamPZGsh1",
                    "price_1RcnosQiUhrwJo9CzIMCgiea",
                    "price_1RcnpzQiUhrwJo9CVz7Wsug6",
                    "price_1RcnqKQiUhrwJo9CCdhvD8Ep",
                  ]}
                >
                  <Admin />
                </ProtectedRoute>
              }
            />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </PlanProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
