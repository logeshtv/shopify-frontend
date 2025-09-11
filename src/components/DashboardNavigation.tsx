import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  BarChart3,
  FileText,
  Globe,
  DollarSign,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePlan } from "@/context/PlanContext";

const rolePages: Record<string, string[]> = {
  admin: [
    "/products",
    "/hs-codes",
    "/documents",
    "/landed-cost",
    "/esg",
    "/billing",
    "/admin",
  ],
  manager: ["/products", "/hs-codes", "/documents", "/landed-cost", "/esg"],
  analyst: ["/products", "/hs-codes", "/documents", "/landed-cost"],
  viewer: ["/products"],
};

export const DashboardNavigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { priceId, loading } = usePlan();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isLoggedIn = !!token;
  const userType = user.type;
  const userRole = (user.role || "").toLowerCase();

  const navigationItemsFree = [
    { path: "/products", label: "Products", icon: Package },
    { path: "/billing", label: "Billing", icon: CreditCard },
  ];

  const navigationItemsStarter = [
    { path: "/products", label: "Products", icon: Package },
    { path: "/hs-codes", label: "HS Codes", icon: BarChart3 },
    { path: "/documents", label: "Documents", icon: FileText },
    { path: "/billing", label: "Billing", icon: CreditCard },
    { path: "/admin", label: "Admin", icon: Settings },
  ];

  const navigationItems = [
    { path: "/products", label: "Products", icon: Package },
    { path: "/hs-codes", label: "HS Codes", icon: BarChart3 },
    { path: "/documents", label: "Documents", icon: FileText },
    { path: "/landed-cost", label: "Landed Cost", icon: DollarSign },
    { path: "/esg", label: "ESG Risk", icon: Globe },
    { path: "/billing", label: "Billing", icon: CreditCard },
    { path: "/admin", label: "Admin", icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Determine allowed pages for this user
  let allowedPages: string[] = [];
  if (userType === "admin") {
    allowedPages = rolePages.admin;
  } else if (userType === "sub_user" && userRole && rolePages[userRole]) {
    allowedPages = rolePages[userRole];
  }

  if (loading) return null;

  // Free plan
  if (!priceId || priceId === "NULL") {
    return (
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ShopifyQ
              </span>
            </Link>

            <div className="hidden lg:flex items-center space-x-1">
              {navigationItemsFree
                .filter((item) => userType === "admin" || allowedPages.includes(item.path))
                .map((item) => (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant={isActive(item.path) ? "default" : "ghost"}
                      size="sm"
                      className={`flex items-center space-x-2 ${
                        isActive(item.path)
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                ))}
            </div>

            <div className="flex items-center space-x-3">
              {isLoggedIn ? (
                <>
                  
                  <Button variant="ghost" size="sm">
                    <User className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => {
                      localStorage.removeItem("token");
                      localStorage.removeItem("user");
                      navigate("/login");
                    }}
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700"
                    onClick={() => navigate("/login")}
                  >
                    Login
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    onClick={() => navigate("/signup")}
                  >
                    Sign Up
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-slate-200">
              <div className="space-y-2">
                {navigationItemsFree
                  .filter((item) => userType === "admin" || allowedPages.includes(item.path))
                  .map((item) => (
                    <Link key={item.path} to={item.path}>
                      <Button
                        variant={isActive(item.path) ? "default" : "ghost"}
                        size="sm"
                        className={`w-full justify-start flex items-center space-x-2 ${
                          isActive(item.path)
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Button>
                    </Link>
                  ))}
                <div className="flex space-x-2 mt-4">
                  {!isLoggedIn ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-blue-600 hover:text-blue-700"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          navigate("/login");
                        }}
                      >
                        Login
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          navigate("/signup");
                        }}
                      >
                        Sign Up
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-red-600 hover:text-red-700"
                      onClick={() => {
                        localStorage.removeItem("token");
                        localStorage.removeItem("user");
                        setIsMobileMenuOpen(false);
                        navigate("/login");
                      }}
                    >
                      <LogOut className="h-5 w-5" /> Logout
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    );
  }

  // Starter plan
  if (
    priceId === "price_1RcnoUQiUhrwJo9CamPZGsh1" ||
    priceId === "price_1RcnosQiUhrwJo9CzIMCgiea"
  ) {
    return (
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ShopifyQ
              </span>
            </Link>

            <div className="hidden lg:flex items-center space-x-1">
              {navigationItemsStarter
                .filter((item) => userType === "admin" || allowedPages.includes(item.path))
                .map((item) => (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant={isActive(item.path) ? "default" : "ghost"}
                      size="sm"
                      className={`flex items-center space-x-2 ${
                        isActive(item.path)
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                ))}
            </div>

            <div className="flex items-center space-x-3">
              {isLoggedIn ? (
                <>
                  
                  <Button variant="ghost" size="sm">
                    <User className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => {
                      localStorage.removeItem("token");
                      localStorage.removeItem("user");
                      navigate("/login");
                    }}
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700"
                    onClick={() => navigate("/login")}
                  >
                    Login
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    onClick={() => navigate("/signup")}
                  >
                    Sign Up
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-slate-200">
              <div className="space-y-2">
                {navigationItemsStarter
                  .filter((item) => userType === "admin" || allowedPages.includes(item.path))
                  .map((item) => (
                    <Link key={item.path} to={item.path}>
                      <Button
                        variant={isActive(item.path) ? "default" : "ghost"}
                        size="sm"
                        className={`w-full justify-start flex items-center space-x-2 ${
                          isActive(item.path)
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Button>
                    </Link>
                  ))}
                <div className="flex space-x-2 mt-4">
                  {!isLoggedIn ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-blue-600 hover:text-blue-700"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          navigate("/login");
                        }}
                      >
                        Login
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          navigate("/signup");
                        }}
                      >
                        Sign Up
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-red-600 hover:text-red-700"
                      onClick={() => {
                        localStorage.removeItem("token");
                        localStorage.removeItem("user");
                        setIsMobileMenuOpen(false);
                        navigate("/login");
                      }}
                    >
                      <LogOut className="h-5 w-5" /> Logout
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    );
  }

  // All features for other plans
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ShopifyQ
            </span>
          </Link>

          <div className="hidden lg:flex items-center space-x-1">
            {navigationItems
              .filter((item) => userType === "admin" || allowedPages.includes(item.path))
              .map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                    size="sm"
                    className={`flex items-center space-x-2 ${
                      isActive(item.path)
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              ))}
          </div>

          <div className="flex items-center space-x-3">
            {isLoggedIn ? (
              <>
                
                <Button variant="ghost" size="sm">
                  <User className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/login");
                  }}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700"
                  onClick={() => navigate("/login")}
                >
                  Login
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  onClick={() => navigate("/signup")}
                >
                  Sign Up
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-200">
            <div className="space-y-2">
              {navigationItems
                .filter((item) => userType === "admin" || allowedPages.includes(item.path))
                .map((item) => (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant={isActive(item.path) ? "default" : "ghost"}
                      size="sm"
                      className={`w-full justify-start flex items-center space-x-2 ${
                        isActive(item.path)
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                ))}
              <div className="flex space-x-2 mt-4">
                {!isLoggedIn ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-blue-600 hover:text-blue-700"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigate("/login");
                      }}
                    >
                      Login
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigate("/signup");
                      }}
                    >
                      Sign Up
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-red-600 hover:text-red-700"
                    onClick={() => {
                      localStorage.removeItem("token");
                      localStorage.removeItem("user");
                      setIsMobileMenuOpen(false);
                      navigate("/login");
                    }}
                  >
                    <LogOut className="h-5 w-5" /> Logout
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
