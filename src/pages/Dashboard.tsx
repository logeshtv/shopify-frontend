import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Package,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Globe,
  Users,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";
import { DashboardNavigation } from "@/components/DashboardNavigation";
import { supabase } from "../lib/supabaseClient";

const Dashboard = () => {
  const [syncProgress, setSyncProgress] = useState(0);
  const [shopData, setShopData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [userName, setUserName] = useState("");
  const backend = import.meta.env.VITE_BACKEND_ENDPOINT;

  useEffect(() => {
    const fetchShopifyData = async () => {
      setLoading(true);
      setError("");
      try {
        const email = localStorage.getItem("user_email");
        const userType = localStorage.getItem("user_type");
        if (!email) {
          setError("User not logged in");
          setLoading(false);
          return;
        }
        let shop = null;
        let shopify_access_token = null;
        let displayName = "";
        if (userType === "sub_user") {
          // Fetch sub_user, then their owner (admin)
          const { data: subUser, error: subUserError } = await supabase
            .from("sub_users")
            .select("id, name, owner_id")
            .eq("email", email)
            .single();
          if (subUserError || !subUser) {
            setError("Sub-user not found");
            setLoading(false);
            return;
          }
          displayName = subUser.name || "";
          // Fetch admin's shop
          const { data: shopRow, error: shopError } = await supabase
            .from("shops")
            .select("shopify_domain, shopify_access_token")
            .eq("user_id", subUser.owner_id)
            .single();
          if (shopError || !shopRow) {
            setError("Shop not found");
            setLoading(false);
            return;
          }
          shop = shopRow.shopify_domain;
          shopify_access_token = shopRow.shopify_access_token;
        } else {
          // Admin user
          const { data: user, error: userError } = await supabase
            .from("users")
            .select("id, name")
            .eq("email", email)
            .single();
          if (userError || !user) {
            setError("User not found");
            setLoading(false);
            return;
          }
          displayName = user.name || "";
          const { data: shopRow, error: shopError } = await supabase
            .from("shops")
            .select("shopify_domain, shopify_access_token")
            .eq("user_id", user.id)
            .single();
          if (shopError || !shopRow) {
            setError("Shop not found");
            setLoading(false);
            return;
          }
          shop = shopRow.shopify_domain;
          shopify_access_token = shopRow.shopify_access_token;
        }
        if (!shopify_access_token) {
          setError(
            "Shopify access token not found. Please reconnect your store."
          );
          setLoading(false);
          return;
        }
        setUserName(displayName);

        // Fetch shop data from backend proxy
        const response = await fetch(`${backend}/shopify/shop-info`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shop,
            accessToken: shopify_access_token,
          }),
        });
        if (!response.ok) {
          throw new Error("Failed to fetch shop data from Shopify");
        }
        const shopifyData = await response.json();
        setShopData(shopifyData.shop);
        // Fetch products from backend
        const productsRes = await fetch(`${backend}/shopify/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shop,
            accessToken: shopify_access_token,
          }),
        });
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData.products || []);
        }
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard");
        setLoading(false);
      }
    };
    fetchShopifyData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSyncProgress((prev) => (prev >= 100 ? 0 : prev + 10));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const statsCards = [
    {
      title: "Total Products",
      value: "1,247",
      change: "+12%",
      changeType: "increase",
      icon: Package,
      color: "blue",
    },
    {
      title: "Compliance Score",
      value: "94%",
      change: "+3%",
      changeType: "increase",
      icon: CheckCircle,
      color: "green",
    },
    {
      title: "Pending Reviews",
      value: "23",
      change: "-8",
      changeType: "decrease",
      icon: Clock,
      color: "orange",
    },
    {
      title: "Risk Alerts",
      value: "5",
      change: "+2",
      changeType: "increase",
      icon: AlertTriangle,
      color: "red",
    },
  ];

  const recentActivity = [
    {
      title: "HS Code updated for Wireless Headphones",
      time: "2 minutes ago",
      type: "update",
      status: "success",
    },
    {
      title: "Export documentation generated for EU shipment",
      time: "15 minutes ago",
      type: "document",
      status: "success",
    },
    {
      title: "ESG risk alert: High carbon footprint detected",
      time: "1 hour ago",
      type: "alert",
      status: "warning",
    },
    {
      title: "Product sync completed: 156 items processed",
      time: "2 hours ago",
      type: "sync",
      status: "success",
    },
  ];

  const upcomingTasks = [
    {
      title: "Review HS codes for Electronics category",
      priority: "high",
      dueDate: "Today",
    },
    {
      title: "Update ESG documentation for Q4",
      priority: "medium",
      dueDate: "Tomorrow",
    },
    {
      title: "Generate reports for customs audit",
      priority: "low",
      dueDate: "Next week",
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        Loading dashboard...
      </div>
    );
  }
  if (error && error !== "Shop not found") {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div style={{ color: "#dc2626", marginBottom: 16 }}>{error}</div>
        <button
          style={{
            background: "#2563eb",
            color: "white",
            padding: "0.75rem 1.5rem",
            borderRadius: "0.375rem",
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
            marginBottom: 16,
          }}
          onClick={async () => {
            setError("");
            setLoading(true);
            // Try to fetch user and shop again
            const email = localStorage.getItem("user_email");
            if (!email) {
              setError("User not logged in");
              setLoading(false);
              return;
            }
            const { data: user } = await supabase
              .from("users")
              .select("id")
              .eq("email", email)
              .single();
            if (!user) {
              setError("User not found");
              setLoading(false);
              return;
            }
            // Try to find any shop for this user
            const { data: shop } = await supabase
              .from("shops")
              .select("shopify_domain")
              .eq("user_id", user.id)
              .single();
            if (shop && shop.shopify_domain) {
              // Redirect to Shopify OAuth
              const shopifyAuthUrl = `https://${
                shop.shopify_domain
              }/admin/oauth/authorize?client_id=${
                import.meta.env.VITE_SHOPIFY_API_KEY
              }&scope=read_products,write_products,read_orders,write_orders&redirect_uri=${encodeURIComponent(
                import.meta.env.VITE_REDIRECT_URI || "/auth/callback"
              )}&state=${Math.random().toString(36).substring(2, 15)}`;
              window.location.href = shopifyAuthUrl;
            } else {
              setError(
                "No shop domain found for this user. Please sign up again."
              );
              setLoading(false);
            }
          }}
        >
          Reconnect Store
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNavigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back, {userName ? userName : "Shopify User"}! 👋
          </h1>
          <p className="text-slate-600">
            Here's what's happening with your compliance automation today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Card
              key={index}
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {stat.value}
                    </p>
                    <div className="flex items-center mt-2">
                      {stat.changeType === "increase" ? (
                        <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span
                        className={`text-sm ${
                          stat.changeType === "increase"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Shopify Products */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2 text-blue-600" />
                  Your Shopify Products
                </CardTitle>
                <CardDescription>
                  Showing the first 5 products from your store
                </CardDescription>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="text-slate-500">No products found.</div>
                ) : (
                  <ul className="divide-y divide-slate-200">
                    {products.map((product) => (
                      <li
                        key={product.id}
                        className="py-3 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium text-slate-900">
                            {product.title}
                          </div>
                          <div className="text-xs text-slate-500">
                            ID: {product.id}
                          </div>
                        </div>
                        {product.image && product.image.src && (
                          <img
                            src={product.image.src}
                            alt={product.title}
                            className="h-10 w-10 object-cover rounded"
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            {/* Sync Status */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2 text-blue-600" />
                  Shopify Product Sync
                </CardTitle>
                <CardDescription>
                  Real-time synchronization with your Shopify store
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">
                      Sync Progress
                    </span>
                    <span className="text-sm font-medium">{syncProgress}%</span>
                  </div>
                  <Progress value={syncProgress} className="h-2" />
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Last sync: 2 hours ago</span>
                    <span>1,247 products synced</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    Sync Now
                  </Button>
                </div>
              </CardContent>
            </Card>
            {/* Quick Actions */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and workflows</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Link to="/products">
                    <Button
                      variant="outline"
                      className="w-full h-20 flex flex-col"
                    >
                      <Package className="h-6 w-6 mb-2" />
                      <span>Manage Products</span>
                    </Button>
                  </Link>
                  <Link to="/hs-codes">
                    <Button
                      variant="outline"
                      className="w-full h-20 flex flex-col"
                    >
                      <BarChart3 className="h-6 w-6 mb-2" />
                      <span>HS Code Detection</span>
                    </Button>
                  </Link>
                  <Link to="/documents">
                    <Button
                      variant="outline"
                      className="w-full h-20 flex flex-col"
                    >
                      <FileText className="h-6 w-6 mb-2" />
                      <span>Export Docs</span>
                    </Button>
                  </Link>
                  <Link to="/esg">
                    <Button
                      variant="outline"
                      className="w-full h-20 flex flex-col"
                    >
                      <Globe className="h-6 w-6 mb-2" />
                      <span>ESG Risk Panel</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            {/* Recent Activity */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-purple-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div
                        className={`mt-1 w-2 h-2 rounded-full ${
                          activity.status === "success"
                            ? "bg-green-500"
                            : activity.status === "warning"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">
                          {activity.title}
                        </p>
                        <p className="text-xs text-slate-600">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Compliance Overview */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Compliance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-600">
                        HS Code Coverage
                      </span>
                      <span className="text-sm font-medium">94%</span>
                    </div>
                    <Progress value={94} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-600">
                        Export Readiness
                      </span>
                      <span className="text-sm font-medium">87%</span>
                    </div>
                    <Progress value={87} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-600">
                        ESG Compliance
                      </span>
                      <span className="text-sm font-medium">76%</span>
                    </div>
                    <Progress value={76} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Alerts */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                  Risk Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900">
                        High ESG Risk Product
                      </p>
                      <p className="text-xs text-red-700">
                        Leather jacket from unverified supplier
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-900">
                        Missing HS Code
                      </p>
                      <p className="text-xs text-yellow-700">
                        23 products need classification
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-900">
                        Documentation Gap
                      </p>
                      <p className="text-xs text-orange-700">
                        COO missing for EU exports
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Tasks */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-blue-600" />
                  Upcoming Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingTasks.map((task, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg"
                    >
                      <Badge
                        variant={
                          task.priority === "high"
                            ? "destructive"
                            : task.priority === "medium"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {task.priority}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {task.title}
                        </p>
                        <p className="text-xs text-slate-600">
                          Due: {task.dueDate}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
