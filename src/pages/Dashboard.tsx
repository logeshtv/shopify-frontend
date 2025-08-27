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
import {
  BarChart3,
  Package,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  ArrowUp,
  ArrowDown,
  Bell,
  Plus,
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

  // Handle Stripe success callback

useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('success') === 'true') {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Payment successful! Please log in to access your dashboard.');
      window.location.href = '/login';
      return;
    }
    
    // Refresh plan data after successful payment
    setTimeout(() => {
      window.location.reload(); // Force refresh to get updated plan
    }, 2000);
    
    // Remove success param from URL
    window.history.replaceState({}, document.title, '/dashboard');
  }
}, []);


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (!token) {
          window.location.href = '/login';
          return;
        }

        setUserName(user.name || 'User');

        const { shop, accessToken } = await resolveShopAndToken();

        if (shop && accessToken) {
          // Shop info
          const shopRes = await fetch(`${backend}/shopify/shop-info`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ shop, accessToken }),
          });
          if (shopRes.ok) {
            const shopData = await shopRes.json();
            setShopData(shopData.shop);
          }

          // Products
          const productsRes = await fetch(`${backend}/shopify/getAllProducts`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ shop, accessToken }),
          });
          if (productsRes.ok) {
            const productsData = await productsRes.json();
            setProducts(productsData.products || []);
          }
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [backend]);

  // One‑time sync progress animation
  useEffect(() => {
    const interval = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 40);

    return () => clearInterval(interval);
  }, []);

  // Derived metrics
  const totalProducts = products.length;
  const hsCoded = products.filter((p) => p?.hs_code).length;
  const needReview = totalProducts - hsCoded;
  const complianceScore =
    totalProducts > 0 ? Math.round((hsCoded / totalProducts) * 100) : 0;

  const statsCards = [
    {
      title: "Total Products",
      value: totalProducts.toString(),
      change: "+12%",
      changeType: "increase",
      icon: Package,
      color: "blue",
    },
    {
      title: "Compliance Score",
      value: `${complianceScore}%`,
      change: "+3%",
      changeType: "increase",
      icon: CheckCircle,
      color: "green",
    },
    {
      title: "Need Review",
      value: needReview.toString(),
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
      status: "success",
    },
    {
      title: "Export documentation generated for EU shipment",
      time: "15 minutes ago",
      status: "success",
    },
    {
      title: "ESG risk alert: High carbon footprint detected",
      time: "1 hour ago",
      status: "warning",
    },
    {
      title: `Product sync completed: ${totalProducts} items processed`,
      time: "2 hours ago",
      status: "success",
    },
  ];

  const upcomingTasks = [
    { title: "Review HS codes for Electronics category", priority: "high", dueDate: "Today" },
    { title: "Update ESG documentation for Q4", priority: "medium", dueDate: "Tomorrow" },
    { title: "Generate reports for customs audit", priority: "low", dueDate: "Next week" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNavigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back, {userName}! 👋
          </h1>
          <p className="text-slate-600">
            Here's what's happening with your compliance automation today.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index} className="border-0 shadow-lg">
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

        {/* Main grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Products overview */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Package className="h-5 w-5 mr-2 text-blue-600" />
                    Your Products ({totalProducts})
                  </div>
                  <Link to="/products">
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </Link>
                </CardTitle>
                <CardDescription>
                  Recent products from your Shopify store
                </CardDescription>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="text-slate-500 text-center py-8">
                    No products found. Sync your Shopify store to get started.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {products.slice(0, 5).map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                            {product?.image?.src ? (
                              <img
                                src={product.image.src}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 truncate">
                              {product.title}
                            </div>
                            <div className="text-xs text-slate-500">
                              ${product.variants?.[0]?.price || "0.00"}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={product.hs_code ? "default" : "secondary"}
                        >
                          {product.hs_code ? "Coded" : "Pending"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sync status */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2 text-blue-600" />
                  Sync Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Progress</span>
                    <span className="text-sm font-medium">{syncProgress}%</span>
                  </div>
                  <Progress value={syncProgress} className="h-2" />
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Last sync: a sec ago</span>
                    <span>{totalProducts} products synced</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick actions */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Link to="/products">
                    <Button variant="outline" className="w-full h-20 flex flex-col">
                      <Package className="h-6 w-6 mb-2" />
                      <span>Products</span>
                    </Button>
                  </Link>
                  <Link to="/hs-codes">
                    <Button variant="outline" className="w-full h-20 flex flex-col">
                      <BarChart3 className="h-6 w-6 mb-2" />
                      <span>HS Codes</span>
                    </Button>
                  </Link>
                  <Link to="/documents">
                    <Button variant="outline" className="w-full h-20 flex flex-col">
                      <FileText className="h-6 w-6 mb-2" />
                      <span>Documents</span>
                    </Button>
                  </Link>
                  <Link to="/esg">
                    <Button variant="outline" className="w-full h-20 flex flex-col">
                      <Globe className="h-6 w-6 mb-2" />
                      <span>ESG Risk</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent activity */}
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
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {activity.title}
                        </p>
                        <p className="text-xs text-slate-600">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-8">
            {/* Compliance overview */}
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
                      <span className="text-sm font-medium">
                        {complianceScore}%
                      </span>
                    </div>
                    <Progress value={complianceScore} className="h-2" />
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

            {/* Risk alerts */}
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
                        {needReview} products need classification
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

            {/* Upcoming tasks */}
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

async function resolveShopAndToken() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const email = user.email;
  const userType = user.type;
  
  let shop, accessToken;

  if (userType === "sub_user") {
    const { data: subUser } = await supabase
      .from("sub_users")
      .select("owner_id")
      .eq("email", email)
      .single();
    const { data: shopRow } = await supabase
      .from("shops")
      .select("shopify_domain, shopify_access_token")
      .eq("user_id", subUser.owner_id)
      .single();
    shop = shopRow?.shopify_domain;
    accessToken = shopRow?.shopify_access_token;
  } else {
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();
    const { data: shopRow } = await supabase
      .from("shops")
      .select("shopify_domain, shopify_access_token")
      .eq("user_id", user.id)
      .single();
    shop = shopRow?.shopify_domain;
    accessToken = shopRow?.shopify_access_token;
  }
  return { shop, accessToken };
}

export default Dashboard;
