import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Truck,
  Globe,
  Shield,
  Eye,
  Info,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Download,
  Save,
  RefreshCw,
  X,
} from "lucide-react";
import { DashboardNavigation } from "@/components/DashboardNavigation";
import { createClient } from "@supabase/supabase-js";
import COOGenerator from "@/components/COOGenerator";
import InvoiceGenerator from "@/components/InvoiceGenerator";
import PackingListGenerator from "@/components/PackingListGenerator";
import OrderDetailsModal from "@/components/OrderDetailsModal";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const LoadingSpinner = ({ size = "md" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin`}
      ></div>
    </div>
  );
};

const Documents = () => {
  const backend = import.meta.env.VITE_BACKEND_ENDPOINT;
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [generatedCertificates, setGeneratedCertificates] = useState([]);

  // Fetch certificates from Supabase
  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const email = localStorage.getItem("user_email");
        if (!email) return;

        const { data, error } = await supabase
          .from("certificates_of_origin")
          .select("*")
          .eq("user_email", email);

        if (error) {
          console.error("Error fetching certificates:", error);
          return;
        }

        if (data) {
          console.log("Fetched certificates:", data);
          setGeneratedCertificates(data);
        }
      } catch (error) {
        console.error("Error in fetchCertificates:", error);
      }
    };
    fetchCertificates();
  }, []);

  // Function to save certificate to Supabase
  const handleCertificateGenerated = async (product) => {
    try {
      const email = localStorage.getItem("user_email");
      if (!email) {
        console.error("No user email found");
        return;
      }

      const certificateData = {
        product_id: String(product.id), // Ensure it's a string
        product_name: product.name,
        vendor: product.vendor,
        product_type: product.type,
        certificate_number: `COO-${product.id}`,
        user_email: email,
        status: "generated",
      };

      console.log("Saving certificate:", certificateData);

      const { data, error } = await supabase
        .from("certificates_of_origin")
        .insert([certificateData])
        .select();

      if (error) {
        console.error("Error saving certificate:", error);
        return;
      }

      if (data && data.length > 0) {
        console.log("Certificate saved successfully:", data[0]);
        setGeneratedCertificates((prev) => [...prev, data[0]]);
      }
    } catch (error) {
      console.error("Error in handleCertificateGenerated:", error);
    }
  };

  // Fetch orders from Shopify
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setOrdersLoading(true);
        const email = localStorage.getItem("user_email");
        const userType = localStorage.getItem("user_type");

        let shop, shopify_access_token;
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

          shop = shopRow.shopify_domain;
          shopify_access_token = shopRow.shopify_access_token;
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

          shop = shopRow.shopify_domain;
          shopify_access_token = shopRow.shopify_access_token;
        }

        const response = await fetch(`${backend}/shopify/orders/all`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shop, accessToken: shopify_access_token }),
        });

        if (response.ok) {
          const data = await response.json();
          const mappedOrders = (data.orders || []).map((order) => ({
            id: order.id, // This is the actual Shopify order ID (like 5405895344318)
            order_number: order.order_number || order.name, // This is the display number (like #1001)
            customer:
              order.customer?.first_name && order.customer?.last_name
                ? `${order.customer.first_name} ${order.customer.last_name}`
                : order.email || "Unknown Customer",
            date: new Date(order.created_at).toISOString().split("T")[0],
            status:
              order.fulfillment_status || order.financial_status || "pending",
            total: `$${parseFloat(order.total_price || 0).toFixed(2)}`,
            documents: {
              commercialInvoice: "pending",
              packagingList: "pending",
            },
          }));
          setOrders(mappedOrders);
        } else if (response.status === 403) {
          console.warn(
            "Orders API permission denied - using empty orders list"
          );
          setOrders([]);
        } else {
          throw new Error("Failed to fetch orders");
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [backend]);

  // Fetch products from Shopify
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const email = localStorage.getItem("user_email");
        const userType = localStorage.getItem("user_type");

        let shop, shopify_access_token;
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

          shop = shopRow.shopify_domain;
          shopify_access_token = shopRow.shopify_access_token;
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

          shop = shopRow.shopify_domain;
          shopify_access_token = shopRow.shopify_access_token;
        }

        const response = await fetch(`${backend}/shopify/getAllProducts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shop, accessToken: shopify_access_token }),
        });

        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        } else {
          throw new Error("Failed to fetch products");
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [backend]);

  // Map products to include certification status
  const allProducts = useMemo(() => {
    return products.map((product) => {
      const hasCertificate = generatedCertificates.some(
        (cert) => String(cert.product_id) === String(product.id)
      );

      console.log(`Product ${product.id}: hasCertificate = ${hasCertificate}`);

      return {
        id: product.id,
        name: product.title,
        vendor: product.vendor || "N/A",
        type: product.product_type || "N/A",
        certificateOfOrigin: hasCertificate ? "done" : "pending",
        esgStatement: "pending",
      };
    });
  }, [products, generatedCertificates]);

  // Filter state
  const [orderSearch, setOrderSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [productStatusFilter, setProductStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [generatedInvoices, setGeneratedInvoices] = useState([]);
  const [selectedPackingOrder, setSelectedPackingOrder] = useState(null);
  const [generatedPackingLists, setGeneratedPackingLists] = useState<(string | number)[]>([]);
  const [viewOrder, setViewOrder] = useState(null);

  // Helper functions
  const isOrderCompleted = (order) =>
    order.documents.commercialInvoice === "done" &&
    order.documents.packagingList === "done";
  const isProductCertified = (product) =>
    product.certificateOfOrigin === "done" && product.esgStatement === "done";

  // Filtered data
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.id
      .toString()
      .toLowerCase()
      .includes(orderSearch.toLowerCase());
    const matchesCustomer = customerFilter
      ? order.customer.toLowerCase().includes(customerFilter.toLowerCase())
      : true;
    const matchesDateFrom = dateFrom ? order.date >= dateFrom : true;
    const matchesDateTo = dateTo ? order.date <= dateTo : true;
    const matchesStatus =
      orderStatusFilter === "all"
        ? true
        : orderStatusFilter === "completed"
        ? isOrderCompleted(order)
        : !isOrderCompleted(order);
    return (
      matchesSearch &&
      matchesCustomer &&
      matchesDateFrom &&
      matchesDateTo &&
      matchesStatus
    );
  });

  const filteredProducts = allProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.vendor.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.type.toLowerCase().includes(productSearch.toLowerCase());
    const matchesStatus =
      productStatusFilter === "all"
        ? true
        : productStatusFilter === "completed"
        ? isProductCertified(product)
        : !isProductCertified(product);
    return matchesSearch && matchesStatus;
  });

  // Calculations
  const totalOrders = orders.length;
  const completedOrders = orders.filter(isOrderCompleted).length;
  const orderProgress = totalOrders
    ? Math.round((completedOrders / totalOrders) * 100)
    : 0;
  const totalProducts = allProducts.length;
  const certifiedProducts = allProducts.filter(isProductCertified).length;
  const productProgress = totalProducts
    ? Math.round((certifiedProducts / totalProducts) * 100)
    : 0;

  const getStatusBadge = (status) => {
    const variants = {
      fulfilled: "bg-green-100 text-green-800 border-green-200",
      partial: "bg-yellow-100 text-yellow-800 border-yellow-200",
      unfulfilled: "bg-orange-100 text-orange-800 border-orange-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      paid: "bg-green-100 text-green-800 border-green-200",
      authorized: "bg-blue-100 text-blue-800 border-blue-200",
    };
    return (
      <Badge
        className={
          variants[status] || "bg-gray-100 text-gray-800 border-gray-200"
        }
      >
        {status}
      </Badge>
    );
  };

  const getDocStatus = (status) =>
    status === "done" ? (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        Done
      </Badge>
    ) : (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );

  const handleInvoiceGenerated = (orderId) => {
    setGeneratedInvoices((prev) => [...prev, orderId]);
  };

  const handlePackingGenerated = (orderId: string | number) => {
    setGeneratedPackingLists((prev) => [...prev, orderId]);
    // (optional) mark order.documents.packagingList = "done" here if you want
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Export Documentation Dashboard
            </h1>
            <p className="text-gray-600">
              Track, generate, and manage all your export documentation and
              product certifications
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              disabled={loading || ordersLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {loading || ordersLoading ? "Syncing..." : "Sync"}
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Save className="h-4 w-4 mr-2" />
              Save Report
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalOrders}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Orders Documented
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {completedOrders}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Products Certified
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {certifiedProducts}
                  </p>
                </div>
                <Globe className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {orderProgress}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Orders Section */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <CardTitle className="flex items-center text-xl">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    Orders & Documents ({filteredOrders.length})
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Progress:</span>
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-2 bg-blue-500 rounded-full"
                        style={{ width: `${orderProgress}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-blue-700">
                      {orderProgress}%
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant={
                      orderStatusFilter === "all" ? "default" : "outline"
                    }
                    onClick={() => setOrderStatusFilter("all")}
                  >
                    All
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      orderStatusFilter === "pending" ? "default" : "outline"
                    }
                    onClick={() => setOrderStatusFilter("pending")}
                  >
                    Pending
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      orderStatusFilter === "completed" ? "default" : "outline"
                    }
                    onClick={() => setOrderStatusFilter("completed")}
                  >
                    Completed
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Input
                    placeholder="Search Order ID"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                  />
                  <Input
                    placeholder="Customer name"
                    value={customerFilter}
                    onChange={(e) => setCustomerFilter(e.target.value)}
                  />
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>

                {/* Orders Table */}
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="lg" />
                    <span className="ml-2 text-gray-600">
                      Loading orders...
                    </span>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                            Order ID
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                            Customer
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                            Total
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                            Invoice
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                            Packing
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-mono text-gray-900">
                              #{order.id.toString().slice(-4)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {order.customer}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {order.date}
                            </td>
                            <td className="px-4 py-3">
                              {getStatusBadge(order.status)}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {order.total}
                            </td>
                            <td className="px-4 py-3">
                              {getDocStatus(order.documents.commercialInvoice)}
                            </td>
                            <td className="px-4 py-3">
                              {getDocStatus(order.documents.packagingList)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={generatedInvoices.includes(
                                    order.id
                                  )}
                                  onClick={() => setSelectedOrder(order)} // This passes the full order object with correct ID
                                >
                                  <FileText className="h-3 w-3" />
                                </Button>

                                <Button
  size="sm"
  variant="outline"
  disabled={generatedPackingLists.includes(order.id)}
  onClick={() => setSelectedPackingOrder(order)}
>
  <Truck className="h-3 w-3 mr-1" />
</Button>
<Button size="sm" variant="ghost" onClick={() => setViewOrder(order)}>
  <Eye className="h-3 w-3" />
</Button>

                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Products Section */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <CardTitle className="flex items-center text-xl">
                    <Globe className="h-5 w-5 mr-2 text-green-600" />
                    Products & Certificates ({filteredProducts.length})
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Progress:</span>
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-2 bg-green-500 rounded-full"
                        style={{ width: `${productProgress}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-green-700">
                      {productProgress}%
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant={
                      productStatusFilter === "all" ? "default" : "outline"
                    }
                    onClick={() => setProductStatusFilter("all")}
                  >
                    All
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      productStatusFilter === "pending" ? "default" : "outline"
                    }
                    onClick={() => setProductStatusFilter("pending")}
                  >
                    Pending
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      productStatusFilter === "completed"
                        ? "default"
                        : "outline"
                    }
                    onClick={() => setProductStatusFilter("completed")}
                  >
                    Certified
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Product Search */}
                <div className="mb-6">
                  <Input
                    placeholder="Search products, vendor, or type"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="max-w-md"
                  />
                </div>

                {/* Products Table */}
                {error ? (
                  <div className="text-red-600 p-4">{error}</div>
                ) : loading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="lg" />
                    <span className="ml-2 text-gray-600">
                      Loading products...
                    </span>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                            Product
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                            Vendor
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                            Origin Cert
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                            ESG Statement
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredProducts.map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {product.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {product.vendor}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {product.type}
                            </td>
                            <td className="px-4 py-3">
                              {getDocStatus(product.certificateOfOrigin)}
                            </td>
                            <td className="px-4 py-3">
                              {getDocStatus(product.esgStatement)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={
                                    product.certificateOfOrigin === "done"
                                  }
                                  onClick={() =>
                                    product.certificateOfOrigin !== "done" &&
                                    setSelectedProduct(product)
                                  }
                                  className={
                                    product.certificateOfOrigin === "done"
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }
                                >
                                  <Globe className="h-3 w-3 mr-1" />
                                  {product.certificateOfOrigin === "done"
                                    ? "Generated"
                                    : "Certificate"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={product.esgStatement === "done"}
                                >
                                  <Shield className="h-3 w-3 mr-1" />
                                  ESG
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Info className="h-5 w-5 mr-2 text-blue-600" />
                  Documentation Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    Ensure all orders have both Commercial Invoice and Packaging
                    List
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    Certify each product with Certificate of Origin and ESG
                    Statement
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    Use filters to quickly find pending documentation
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Shield className="h-5 w-5 mr-2 text-green-600" />
                  Compliance Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Certified Products
                    </span>
                    <Badge className="bg-green-100 text-green-800">
                      {certifiedProducts}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Pending Certifications
                    </span>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {totalProducts - certifiedProducts}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FileText className="h-5 w-5 mr-2 text-purple-600" />
                  Document Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Commercial Invoice
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-purple-600" />
                    Packing List
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-green-600" />
                    Certificate of Origin
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-600" />
                    ESG Statement
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <COOGenerator
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onGenerated={handleCertificateGenerated}
      />

      <InvoiceGenerator
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onGenerated={handleInvoiceGenerated}
      />

<PackingListGenerator
  order={selectedPackingOrder}
  onClose={() => setSelectedPackingOrder(null)}
  onGenerated={handlePackingGenerated}
/>

<OrderDetailsModal
  order={viewOrder}
  onClose={() => setViewOrder(null)}
/>



    </div>
  );
};

export default Documents;
