import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard,
  Check,
  Star,
  Calendar,
  Download,
  Settings,
  AlertTriangle,
  Crown,
  Zap,
} from "lucide-react";
import { DashboardNavigation } from "@/components/DashboardNavigation";
import React from "react";
import { usePlan } from "@/context/PlanContext";

const Billing = () => {
  const [currentPlan, setCurrentPlan] = useState("");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [loadingPlan, setLoadingPlan] = useState("");
  const { priceId, loading } = usePlan();

  useEffect(() => {
    if (priceId && priceId !== null) {
      if (
        priceId === "price_1RcnoUQiUhrwJo9CamPZGsh1" ||
        priceId === "price_1RcnosQiUhrwJo9CzIMCgiea"
      ) {
        setCurrentPlan("starter");
      } else if (
        priceId === "price_1RcnpzQiUhrwJo9CVz7Wsug6" ||
        priceId === "price_1RcnqKQiUhrwJo9CCdhvD8Ep"
      ) {
        setCurrentPlan("pro");
      } else {
        setCurrentPlan("free");
      }
      // sd
    }
  }, [priceId]);

  const handleCheckout = async (priceId: string, planId: string) => {
    setLoadingPlan(planId);
    try {
      const email = localStorage.getItem("user_email");
      if (!email) {
        alert("User not logged in. Please log in to continue.");
        setLoadingPlan("");
        return;
      }

      const backend = import.meta.env.VITE_BACKEND_ENDPOINT;

      const response = await fetch(`${backend}/stripe/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId, email }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session.");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("An error occurred during checkout. Please try again.");
    } finally {
      setLoadingPlan("");
    }
  };

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: { monthly: 29, yearly: 290 },
      stripePriceId: {
        monthly: "price_1RcnoUQiUhrwJo9CamPZGsh1",
        yearly: "price_1RcnosQiUhrwJo9CzIMCgiea",
      },

      description: "Perfect for small DTC brands getting started",
      features: [
        "Up to 100 products",
        "Basic HS code detection",
        "Export documentation",
        "Email support",
        "1 team member",
      ],
      popular: false,
      icon: Zap,
    },
    {
      id: "pro",
      name: "Professional",
      price: { monthly: 99, yearly: 990 },
      stripePriceId: {
        monthly: "price_1RcnpzQiUhrwJo9CVz7Wsug6",
        yearly: "price_1RcnqKQiUhrwJo9CCdhvD8Ep",
      },
      description: "Ideal for growing businesses with complex needs",
      features: [
        "Up to 1,000 products",
        "AI-powered HS code detection",
        "Advanced export documentation",
        "Landed cost calculator",
        "ESG risk assessment",
        "Priority support",
        "5 team members",
        "API access",
      ],
      popular: true,
      icon: Star,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: { monthly: 299, yearly: 2990 },
      stripePriceId: {
        monthly: "price_1QZ002FZ0000000000000000",
        yearly: "price_1QZ002FZ0000000000000000",
      },
      description: "For large organizations with advanced compliance needs",
      features: [
        "Unlimited products",
        "Custom AI model training",
        "White-label documentation",
        "Advanced ESG analytics",
        "Dedicated account manager",
        "24/7 phone support",
        "Unlimited team members",
        "Custom integrations",
        "SLA guarantee",
      ],
      popular: false,
      icon: Crown,
    },
  ];

  const billingHistory = [
    {
      id: "1",
      date: "2024-01-15",
      description: "Professional Plan - Monthly",
      amount: "$99.00",
      status: "paid",
      invoice: "INV-2024-001",
    },
    {
      id: "2",
      date: "2023-12-15",
      description: "Professional Plan - Monthly",
      amount: "$99.00",
      status: "paid",
      invoice: "INV-2023-012",
    },
    {
      id: "3",
      date: "2023-11-15",
      description: "Professional Plan - Monthly",
      amount: "$99.00",
      status: "paid",
      invoice: "INV-2023-011",
    },
    {
      id: "4",
      date: "2023-10-15",
      description: "Starter Plan - Monthly",
      amount: "$29.00",
      status: "paid",
      invoice: "INV-2023-010",
    },
  ];

  const usageStats = [
    {
      metric: "Products Processed",
      current: 847,
      limit: 1000,
      unit: "products",
    },
    {
      metric: "HS Code Detections",
      current: 1240,
      limit: "unlimited",
      unit: "detections",
    },
    {
      metric: "Documents Generated",
      current: 156,
      limit: "unlimited",
      unit: "documents",
    },
    { metric: "Team Members", current: 3, limit: 5, unit: "members" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const calculateSavings = (monthlyPrice: number, yearlyPrice: number) => {
    const yearlyMonthly = monthlyPrice * 12;
    const savings = yearlyMonthly - yearlyPrice;
    const percentage = Math.round((savings / yearlyMonthly) * 100);
    return { amount: savings, percentage };
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNavigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Billing & Subscription
            </h1>
            <p className="text-slate-600">
              Manage your subscription and billing preferences
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Payment Settings
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Download className="h-4 w-4 mr-2" />
              Download Invoices
            </Button>
          </div>
        </div>

        {/* Current Plan Status */}
        <Card className="border-0 shadow-lg mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  {currentPlan === "free" || currentPlan === "" ? (
                    <Star className="h-6 w-6 text-white" />
                  ) : plans.find((p) => p.id === currentPlan)?.icon ? (
                    React.createElement(
                      plans.find((p) => p.id === currentPlan).icon,
                      { className: "h-6 w-6 text-white" }
                    )
                  ) : (
                    <Star className="h-6 w-6 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {currentPlan === "free" || currentPlan === ""
                      ? "Free Plan"
                      : plans.find((p) => p.id === currentPlan)?.name ||
                        "Unknown Plan"}
                  </h2>
                  <p className="text-slate-600">
                    {currentPlan === "free" || currentPlan === ""
                      ? "No subscription. Enjoy our free features!"
                      : `Active until next billing cycle`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900">
                  {currentPlan === "free" || currentPlan === ""
                    ? "$0"
                    : `$${
                        plans.find((p) => p.id === currentPlan)?.price[
                          billingCycle
                        ]
                      }`}
                </div>
                <div className="text-sm text-slate-600">
                  {currentPlan === "free" || currentPlan === ""
                    ? "per month"
                    : billingCycle === "yearly"
                    ? "per year"
                    : "per month"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="plans" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="plans">Plans & Pricing</TabsTrigger>
            <TabsTrigger value="usage">Usage & Limits</TabsTrigger>
            <TabsTrigger value="history">Billing History</TabsTrigger>
          </TabsList>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            {/* Billing Cycle Toggle */}
            <div className="flex justify-center">
              <div className="bg-white p-1 rounded-lg border border-slate-200 flex">
                <Button
                  variant={billingCycle === "monthly" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setBillingCycle("monthly")}
                >
                  Monthly
                </Button>
                <Button
                  variant={billingCycle === "yearly" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setBillingCycle("yearly")}
                >
                  Yearly
                  <Badge className="ml-2 bg-green-100 text-green-700">
                    Save 20%
                  </Badge>
                </Button>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const savings = calculateSavings(
                  plan.price.monthly,
                  plan.price.yearly
                );
                const price = plan.price[billingCycle];
                const isCurrentPlan = plan.id === currentPlan;

                return (
                  <Card
                    key={plan.id}
                    className={`border-0 shadow-lg relative ${
                      plan.popular ? "border-2 border-blue-500 scale-105" : ""
                    } ${isCurrentPlan ? "ring-2 ring-green-500" : ""}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-blue-600 text-white">
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    {isCurrentPlan && (
                      <div className="absolute -top-3 right-4">
                        <Badge className="bg-green-600 text-white">
                          Current Plan
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="text-center">
                      <div className="mx-auto mb-4 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <plan.icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="mt-4">
                        <div className="text-3xl font-bold text-slate-900">
                          ${price}
                        </div>
                        <div className="text-sm text-slate-600">
                          per {billingCycle === "yearly" ? "year" : "month"}
                        </div>
                        {billingCycle === "yearly" && (
                          <div className="text-sm text-green-600 font-medium">
                            Save ${savings.amount} ({savings.percentage}%)
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        {plan.features.map((feature, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-3"
                          >
                            <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-slate-700">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>

                      <Button
                        className={`w-full ${
                          isCurrentPlan
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-gradient-to-r from-blue-600 to-purple-600"
                        }`}
                        disabled={isCurrentPlan || loadingPlan === plan.id}
                        onClick={() =>
                          handleCheckout(
                            plan.stripePriceId[billingCycle],
                            plan.id
                          )
                        }
                      >
                        {isCurrentPlan
                          ? "Current Plan"
                          : loadingPlan === plan.id
                          ? "Redirecting..."
                          : `Upgrade to ${plan.name}`}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {usageStats.map((stat, index) => (
                <Card key={index} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-slate-900">
                        {stat.metric}
                      </h3>
                      <Badge variant="outline">
                        {stat.current} / {stat.limit} {stat.unit}
                      </Badge>
                    </div>
                    {typeof stat.limit === "number" && (
                      <>
                        <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                          <div
                            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                            style={{
                              width: `${(stat.current / stat.limit) * 100}%`,
                            }}
                          />
                        </div>
                        <div className="text-sm text-slate-600">
                          {Math.round((stat.current / stat.limit) * 100)}% used
                        </div>
                      </>
                    )}
                    {stat.limit === "unlimited" && (
                      <div className="text-sm text-green-600 font-medium">
                        ✓ Unlimited usage
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Usage Alerts */}
            <Card className="border-0 shadow-lg border-yellow-200 bg-yellow-50">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-1">
                      Approaching Product Limit
                    </h3>
                    <p className="text-sm text-yellow-800">
                      You've used 84.7% of your product processing limit.
                      Consider upgrading to avoid service interruption.
                    </p>
                    <Button
                      size="sm"
                      className="mt-3 bg-yellow-600 hover:bg-yellow-700"
                    >
                      Upgrade Plan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  Billing History
                </CardTitle>
                <CardDescription>
                  Your payment history and invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {billingHistory.map((bill) => (
                    <div
                      key={bill.id}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <CreditCard className="h-5 w-5 text-slate-400" />
                        <div>
                          <h4 className="font-medium text-slate-900">
                            {bill.description}
                          </h4>
                          <p className="text-sm text-slate-600">{bill.date}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <Badge className={getStatusColor(bill.status)}>
                          {bill.status}
                        </Badge>
                        <span className="font-semibold text-slate-900">
                          {bill.amount}
                        </span>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-purple-600" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">
                        •••• •••• •••• 4242
                      </h4>
                      <p className="text-sm text-slate-600">Expires 12/2026</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Update
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Billing;
