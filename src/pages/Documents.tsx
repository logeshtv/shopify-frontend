import { useState, useEffect, useMemo, useCallback } from "react";
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
} from "lucide-react";
import { DashboardNavigation } from "@/components/DashboardNavigation";
import { createClient } from "@supabase/supabase-js";
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

// ESG Modal Component
const ESGModal = ({ product, onClose }) => {
  const [esgData, setEsgData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchESGData = async () => {
    if (!product) return;

    setLoading(true);
    setError("");

    try {
      const { data } = await supabase
        .from("product_esg_scores")
        .select("*")
        .eq("product_id", product.id.toString())
        .single();

      if (data) {
        setEsgData(data);
      } else {
        setError("No ESG data available for this product");
      }
    } catch (err) {
      setError("Failed to fetch ESG data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (product) {
      fetchESGData();
    }
  }, [product]);

  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">ESG Data - {product.name}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
            <span className="ml-2">Loading ESG data...</span>
          </div>
        ) : error ? (
          <div className="text-red-600 text-center py-8">{error}</div>
        ) : esgData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded">
                <div className="text-2xl font-bold text-blue-600">
                  {esgData.esg_score}
                </div>
                <div className="text-sm text-gray-600">Total ESG Score</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <div className="text-2xl font-bold text-green-600">
                  {esgData.environment_score}
                </div>
                <div className="text-sm text-gray-600">Environmental</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded">
                <div className="text-2xl font-bold text-purple-600">
                  {esgData.social_score}
                </div>
                <div className="text-sm text-gray-600">Social</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded">
                <div className="text-2xl font-bold text-orange-600">
                  {esgData.governance_score}
                </div>
                <div className="text-sm text-gray-600">Governance</div>
              </div>
            </div>
            <div className="text-center">
              <Badge
                className={`${
                  esgData.risk_level === "low"
                    ? "bg-green-100 text-green-800"
                    : esgData.risk_level === "medium"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {esgData.risk_level.toUpperCase()} RISK
              </Badge>
            </div>
          </div>
        ) : (
          <div className="text-gray-600 text-center py-8">
            No ESG data available
          </div>
        )}
      </div>
    </div>
  );
};

const Documents = () => {
  const backend = import.meta.env.VITE_BACKEND_ENDPOINT;

  // Consolidated state
  const [data, setData] = useState({
    products: [],
    orders: [],
    invoices: [],
    packingLists: [],
  });

  const [loading, setLoading] = useState({
    initial: true,
    orders: false,
    products: false,
    documents: false,
  });

  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedPackingOrder, setSelectedPackingOrder] = useState(null);
  const [viewOrder, setViewOrder] = useState(null);
  const [esgProduct, setEsgProduct] = useState(null);

  // Filter state
  const [orderSearch, setOrderSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");

  const [generateEsgProduct, setGenerateEsgProduct] = useState(null);

  // Get user credentials once
  const getUserCredentials = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const email = user.email;
      const userType = user.type;

      if (!email) throw new Error("No user email found");

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
        const { data: userData } = await supabase
          .from("users")
          .select("id")
          .eq("email", email)
          .single();

        const { data: shopRow } = await supabase
          .from("shops")
          .select("shopify_domain, shopify_access_token")
          .eq("user_id", userData.id)
          .single();

        shop = shopRow.shopify_domain;
        shopify_access_token = shopRow.shopify_access_token;
      }

      return { email, shop, shopify_access_token };
    } catch (error) {
      console.error("Error getting user credentials:", error);
      throw error;
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, initial: true }));
      setError("");

      const credentials = await getUserCredentials();

      // Fetch all data in parallel
      const [
        invoicesResult,
        packingListsResult,
        ordersResult,
        productsResult,
        esgResult,
      ] = await Promise.allSettled([
        // Fetch invoices
        supabase.from("order_invoices").select("order_id, invoice_url"),

        // Fetch packing lists
        supabase
          .from("order_packing_lists")
          .select("order_id, packing_list_url"),

        // Fetch orders
        fetch(`${backend}/shopify/orders/all`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shop: credentials.shop,
            accessToken: credentials.shopify_access_token,
          }),
        }),

        // Fetch products
        fetch(`${backend}/shopify/getAllProducts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shop: credentials.shop,
            accessToken: credentials.shopify_access_token,
          }),
        }),

        // Fetch ESG data
        supabase.from("product_esg_scores").select("product_id"),
      ]);

      // Process results
      const invoices =
        invoicesResult.status === "fulfilled"
          ? invoicesResult.value.data?.map((inv) => String(inv.order_id)) || []
          : [];

      const packingLists =
        packingListsResult.status === "fulfilled"
          ? packingListsResult.value.data?.map((pl) => String(pl.order_id)) ||
            []
          : [];

      const esgProductIds =
        esgResult.status === "fulfilled"
          ? esgResult.value.data?.map((esg) => String(esg.product_id)) || []
          : [];

      let orders = [];
      if (ordersResult.status === "fulfilled" && ordersResult.value.ok) {
        const ordersData = await ordersResult.value.json();
        orders = (ordersData.orders || []).map((order) => ({
          id: order.id,
          order_number: order.name || order.order_number,
          customer:
            order.customer?.firstName && order.customer?.lastName
              ? `${order.customer.firstName} ${order.customer.lastName}`
              : order.email || order.customer?.email || "Unknown Customer",
          date: new Date(order.createdAt).toISOString().split("T")[0],
          status:
            order.displayFulfillmentStatus || order.displayFinancialStatus || "pending",
          total: `${order.totalPriceSet?.shopMoney?.currencyCode || '$'} ${parseFloat(order.totalPriceSet?.shopMoney?.amount || 0).toFixed(2)}`,
          documents: {
            commercialInvoice: invoices.includes(String(order.id))
              ? "done"
              : "pending",
            packagingList: packingLists.includes(String(order.id))
              ? "done"
              : "pending",
          },
        }));
      } else if (ordersResult.status === "fulfilled") {
        console.error('Orders API error:', await ordersResult.value.text());
      } else {
        console.error('Orders fetch failed:', ordersResult.reason);
      }

      let products = [];
      if (productsResult.status === "fulfilled" && productsResult.value.ok) {
        const productsData = await productsResult.value.json();
        products = (productsData.products || []).map((product) => ({
          id: product.id,
          name: product.title,
          vendor: product.vendor || "N/A",
          type: product.product_type || "N/A",
          esgStatus: esgProductIds.includes(String(product.id))
            ? "done"
            : "pending",
        }));
      }

      // Update state once with all data
      setData({
        products,
        orders,
        invoices,
        packingLists,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message || "Failed to fetch data");
    } finally {
      setLoading((prev) => ({ ...prev, initial: false }));
    }
  }, [backend, getUserCredentials]);

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Memoized calculations
  const calculations = useMemo(() => {
    const isOrderCompleted = (order) =>
      order.documents.commercialInvoice === "done" &&
      order.documents.packagingList === "done";

    const totalOrders = data.orders.length;
    const completedOrders = data.orders.filter(isOrderCompleted).length;
    const orderProgress = totalOrders
      ? Math.round((completedOrders / totalOrders) * 100)
      : 0;

    const totalProducts = data.products.length;

    return {
      totalOrders,
      completedOrders,
      orderProgress,
      totalProducts,
      isOrderCompleted,
    };
  }, [data.orders, data.products]);

  // Filtered data
  const filteredOrders = useMemo(() => {
    return data.orders.filter((order) => {
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
          ? calculations.isOrderCompleted(order)
          : !calculations.isOrderCompleted(order);
      return (
        matchesSearch &&
        matchesCustomer &&
        matchesDateFrom &&
        matchesDateTo &&
        matchesStatus
      );
    });
  }, [
    data.orders,
    orderSearch,
    customerFilter,
    dateFrom,
    dateTo,
    orderStatusFilter,
    calculations,
  ]);

  const filteredProducts = useMemo(() => {
    return data.products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.vendor.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.type.toLowerCase().includes(productSearch.toLowerCase());
      return matchesSearch;
    });
  }, [data.products, productSearch]);

  // Event handlers
  const handleInvoiceGenerated = useCallback((orderId) => {
    setData((prev) => ({
      ...prev,
      invoices: [...prev.invoices, String(orderId)],
      orders: prev.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              documents: {
                ...order.documents,
                commercialInvoice: "done",
              },
            }
          : order
      ),
    }));
  }, []);

  const handlePackingGenerated = useCallback((orderId) => {
    setData((prev) => ({
      ...prev,
      packingLists: [...prev.packingLists, String(orderId)],
      orders: prev.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              documents: {
                ...order.documents,
                packagingList: "done",
              },
            }
          : order
      ),
    }));
  }, []);

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
    const ESGGenerateModal = ({ product, onClose }) => {
      const [vendorEmail, setVendorEmail] = useState("");
      const [showRequestForm, setShowRequestForm] = useState(false);
      const [loading, setLoading] = useState(false);
      const [requestStatus, setRequestStatus] = useState(null);
      const [checkingStatus, setCheckingStatus] = useState(true);
    
      // Get suggested vendors based on product type
      const getSuggestedVendors = (productType) => {
        const vendorSuggestions = {
          Electronics: [
            "Samsung", "LG Electronics", "Panasonic", "Sony", "Apple", "Microsoft", "Dell", "HP", "Lenovo", "Asus", "Acer", "Canon", "Epson", "Philips", "Siemens",
          ],
          Clothing: [
            "Patagonia", "H&M Conscious", "Adidas", "Nike", "Puma", "Levi's", "Gap", "Zara", "Uniqlo", "Eileen Fisher", "Reformation", "Everlane", "Organic Basics", "Tentree",
          ],
          Food: [
            "Nestlé", "Unilever", "General Mills", "Danone", "Kellogg's", "Mars", "Mondelez", "PepsiCo", "Coca-Cola", "Kraft Heinz", "Campbell Soup", "ConAgra", "Tyson Foods",
          ],
          Beauty: [
            "L'Oréal", "Unilever", "P&G", "Johnson & Johnson", "Estée Lauder", "Shiseido", "Coty", "Revlon", "Avon", "Mary Kay", "Lush", "The Body Shop", "Burt's Bees",
          ],
          Home: [
            "IKEA", "Philips", "Whirlpool", "Electrolux", "Bosch", "Samsung", "LG", "GE Appliances", "Dyson", "Shark", "Black+Decker", "KitchenAid", "Cuisinart",
          ],
          default: [
            "Patagonia", "Unilever", "IKEA", "Philips", "Samsung", "Nike", "Nestlé", "L'Oréal", "Microsoft", "Apple", "Bosch", "Sony", "Adidas", "H&M Conscious", "General Mills",
          ],
        };
    
        return vendorSuggestions[productType] || vendorSuggestions["default"];
      };
    
      const suggestedVendors = getSuggestedVendors(product?.type);
    
      // Get user ID from localStorage
      const getUserId = () => {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        return user.id || user.email;
      };
    
      // Check if request already sent
      useEffect(() => {
        const checkRequestStatus = async () => {
          if (!product) return;
          
          setCheckingStatus(true);
          try {
            const userId = getUserId();
            const productId = product.id;
            const response = await fetch(
              `${import.meta.env.VITE_BACKEND_ENDPOINT}/esg-request-status/${userId}/${productId}`
            );
            
            if (response.ok) {
              const data = await response.json();
              setRequestStatus(data);
            } else {
              const numericId = productId.toString().replace('gid://shopify/Product/', '');
              const { data: requestData } = await supabase
                .from('esg_requests')
                .select('*')
                .eq('user_id', userId)
                .or(`product_id.eq.${productId},product_id.eq.${numericId}`)
                .single();
              
              if (requestData) {
                setRequestStatus({ 
                  hasRequested: true, 
                  requestData: { vendor_email: requestData.vendor_email } 
                });
              }
            }
          } catch (error) {
            console.error('Error checking request status:', error);
          } finally {
            setCheckingStatus(false);
          }
        };
    
        checkRequestStatus();
      }, [product]);
    
      const handleSendRequest = async () => {
        if (!vendorEmail) return;
    
        setLoading(true);
        try {
          const userId = getUserId();
          const response = await fetch(
            `${import.meta.env.VITE_BACKEND_ENDPOINT}/send-esg-request`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                vendorEmail,
                productName: product.name,
                vendorName: product.vendor,
                userId,
                productId: product.id
              }),
            }
          );
    
          const result = await response.json();
          
          if (response.ok) {
            setRequestStatus({ hasRequested: true, requestData: { vendor_email: vendorEmail } });
            setShowRequestForm(false);
          } else {
            alert("Failed to send request");
          }
        } catch (error) {
          alert("Error sending request");
        } finally {
          setLoading(false);
        }
      };
    
      if (!product) return null;
    
      // Show loading while checking status
      if (checkingStatus) {
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
                <span className="ml-2">Checking request status...</span>
              </div>
            </div>
          </div>
        );
      }
    
      // Show request submitted confirmation
      if (requestStatus?.hasRequested) {
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Request Submitted</h3>
                <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
              </div>
    
              <div className="space-y-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-700">
                    ESG registration request has been sent to{" "}
                    <strong>{requestStatus.requestData?.vendor_email}</strong>
                  </p>
                </div>
    
                <div className="text-center text-sm text-gray-600">
                  <p>We've contacted the vendor about ESG registration for:</p>
                  <p className="font-medium mt-1">{product.name}</p>
                  <p className="text-xs mt-2">
                    You'll be notified once the vendor completes their ESG registration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      }
    
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">ESG Data Not Available</h3>
              <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
            </div>
    
            <div className="space-y-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-sm text-gray-700">
                  Vendor <strong>{product.vendor}</strong> is not registered for ESG scoring
                </p>
              </div>
    
              <div>
                <h4 className="font-medium mb-2">Suggested ESG-Certified Vendors:</h4>
                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  <div className="grid grid-cols-1 gap-1">
                    {suggestedVendors.map((vendor, index) => (
                      <div
                        key={index}
                        className="p-2 bg-green-50 rounded text-sm text-center border border-green-200 hover:bg-green-100 transition-colors"
                      >
                        {vendor}
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  These vendors offer similar products with ESG certification
                </p>
              </div>
    
              <div className="border-t pt-4">
                {!showRequestForm ? (
                  <Button
                    onClick={() => setShowRequestForm(true)}
                    className="w-full"
                    variant="outline"
                  >
                    Request Vendor Registration
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Input
                      placeholder="Enter vendor email address"
                      value={vendorEmail}
                      onChange={(e) => setVendorEmail(e.target.value)}
                      type="email"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSendRequest}
                        disabled={!vendorEmail || loading}
                        className="flex-1"
                      >
                        {loading ? "Sending..." : "Send Request"}
                      </Button>
                      <Button
                        onClick={() => setShowRequestForm(false)}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
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
              Track, generate, and manage all your export documentation
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={fetchAllData}
              disabled={loading.initial}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${
                  loading.initial ? "animate-spin" : ""
                }`}
              />
              {loading.initial ? "Syncing..." : "Sync"}
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

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading.initial ? "..." : calculations.totalOrders}
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
                    {loading.initial ? "..." : calculations.completedOrders}
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
                  <p className="text-sm text-gray-600 mb-1">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading.initial ? "..." : calculations.totalProducts}
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
                    {loading.initial ? "..." : `${calculations.orderProgress}%`}
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
                        className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${calculations.orderProgress}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-blue-700">
                      {calculations.orderProgress}%
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
                {loading.initial ? (
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
                                  disabled={
                                    order.documents.commercialInvoice === "done"
                                  }
                                  onClick={() => setSelectedOrder(order)}
                                >
                                  <FileText className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={
                                    order.documents.packagingList === "done"
                                  }
                                  onClick={() => setSelectedPackingOrder(order)}
                                >
                                  <Truck className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setViewOrder(order)}
                                >
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
                <CardTitle className="flex items-center text-xl">
                  <Globe className="h-5 w-5 mr-2 text-green-600" />
                  Products & ESG ({filteredProducts.length})
                </CardTitle>
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
                {loading.initial ? (
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
                            ESG Status
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
                              {getDocStatus(product.esgStatus)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEsgProduct(product)}
                                >
                                  <Shield className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setGenerateEsgProduct(product)}
                                >
                                  <Info className="h-3 w-3" />
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
                    View ESG data for products to understand sustainability
                    metrics
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
                    <Shield className="h-4 w-4 text-emerald-600" />
                    ESG Statement
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

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

      <OrderDetailsModal order={viewOrder} onClose={() => setViewOrder(null)} />

      <ESGModal product={esgProduct} onClose={() => setEsgProduct(null)} />

      <ESGGenerateModal
        product={generateEsgProduct}
        onClose={() => setGenerateEsgProduct(null)}
      />
    </div>
  );
};

export default Documents;