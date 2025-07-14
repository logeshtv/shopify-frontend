import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { 
  BarChart3, 
  Search, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Upload,
  Download,
  Eye,
  Edit,
  Brain,
  X,
  Filter
} from "lucide-react";
import { DashboardNavigation } from "@/components/DashboardNavigation";
import { supabase } from "../lib/supabaseClient";

const HSCodes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detectingProductId, setDetectingProductId] = useState(null);
  const [detectionProgress, setDetectionProgress] = useState(0);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processedProductIds, setProcessedProductIds] = useState([]);
  const [approvedProductIds, setApprovedProductIds] = useState([]);
  const [modifiedProductIds, setModifiedProductIds] = useState([]);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [autoClassifiedCount, setAutoClassifiedCount] = useState(0);
  const [manualOverridesCount, setManualOverridesCount] = useState(0);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [modifyingProduct, setModifyingProduct] = useState(null);
  const [modifiedHSCode, setModifiedHSCode] = useState("");
  const [modifiedConfidence, setModifiedConfidence] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [savingModification, setSavingModification] = useState(false);

  
  const backend = import.meta.env.VITE_BACKEND_ENDPOINT;

  const recentClassifications = [
    {
      id: "1",
      productName: "Bluetooth Speaker",
      hsCode: "8518.22.00",
      confidence: 96,
      status: "approved",
      classifiedAt: "2 hours ago"
    },
    {
      id: "2",
      productName: "Cotton Dress Shirt",
      hsCode: "6205.20.20",
      confidence: 94,
      status: "approved",
      classifiedAt: "4 hours ago"
    },
    {
      id: "3",
      productName: "Leather Handbag",
      hsCode: "4202.21.60",
      confidence: 89,
      status: "review",
      classifiedAt: "6 hours ago"
    }
  ];

  // Get HS status from product state
  const getHSStatus = (product) => {
    if (approvedProductIds.includes(product.id)) return 'approved';
    if (modifiedProductIds.includes(product.id)) return 'modified';
    return product.hsStatus || 'pending';
  };

  // Filter products based on status
  const filteredProducts = useMemo(() => {
    let filtered = pendingProducts;
    
    if (statusFilter !== "all") {
      filtered = pendingProducts.filter(product => getHSStatus(product) === statusFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [pendingProducts, statusFilter, searchTerm, approvedProductIds, modifiedProductIds]);

  const fetchCounts = async () => {
    try {
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

      const [pendingRes, autoRes, manualRes] = await Promise.all([
        fetch(`${backend}/shopify/PendingReview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shop, accessToken: shopify_access_token }),
        }),
        fetch(`${backend}/shopify/AutoClassified`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shop, accessToken: shopify_access_token }),
        }),
        fetch(`${backend}/shopify/ManualOverrides`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shop, accessToken: shopify_access_token }),
        })
      ]);

      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setPendingReviewCount(data.count);
      }
      if (autoRes.ok) {
        const data = await autoRes.json();
        setAutoClassifiedCount(data.count);
      }
      if (manualRes.ok) {
        const data = await manualRes.json();
        setManualOverridesCount(data.count);
      }
    } catch (error) {
      console.error("Failed to fetch counts:", error);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
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
        
        if (userType === "sub_user") {
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
          const { data: user, error: userError } = await supabase
            .from("users")
            .select("id")
            .eq("email", email)
            .single();
            
          if (userError || !user) {
            setError("User not found");
            setLoading(false);
            return;
          }
          
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
          setError("Shopify access token not found. Please reconnect your store.");
          setLoading(false);
          return;
        }

        const productsRes = await fetch(`${backend}/shopify/getAllProducts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shop,
            accessToken: shopify_access_token,
            filter: statusFilter === "all" ? null : `hs_${statusFilter}`
          }),
        });
        
        if (!productsRes.ok) {
          throw new Error("Failed to fetch products from Shopify");
        }
        
        const productsData = await productsRes.json();
        
        const formattedProducts = (productsData.products || []).map(product => ({
          id: product.id,
          name: product.title,
          description: product.body_html ? product.body_html.replace(/<[^>]*>/g, '') : "No description",
          category: product.product_type || "Unknown",
          suggestedCode: product.hsCode || `${Math.floor(Math.random() * 9000) + 1000}.${Math.floor(Math.random() * 90) + 10}.${Math.floor(Math.random() * 90) + 10}`,
          confidence: product.confidence || Math.floor(Math.random() * 10) + 90,
          hsStatus: product.hsStatus || 'pending',
          alternativeCodes: [
            { 
              code: `${Math.floor(Math.random() * 9000) + 1000}.${Math.floor(Math.random() * 90) + 10}.${Math.floor(Math.random() * 90) + 10}`,
              confidence: Math.floor(Math.random() * 15) + 75,
              description: "Alternative classification" 
            },
            { 
              code: `${Math.floor(Math.random() * 9000) + 1000}.${Math.floor(Math.random() * 90) + 10}.${Math.floor(Math.random() * 90) + 10}`,
              confidence: Math.floor(Math.random() * 10) + 75,
              description: "Alternative classification" 
            }
          ]
        }));
        
        setPendingProducts(formattedProducts);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err.message || "Failed to load products");
        setLoading(false);
      }
    };
    
    fetchProducts();
    fetchCounts();
  }, [statusFilter]);

 // Update handleAIDetection function to use the correct API path
// Update handleAIDetection function to use the correct API request format
const handleAIDetection = async (productId) => {
  try {
    setDetectingProductId(productId);
    setDetectionProgress(0);
    
    // Start progress animation
    const interval = setInterval(() => {
      setDetectionProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 100);
    
    // Get shop credentials
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
    
    // Call API to detect HS code
    const response = await fetch(`${backend}/dutify/hs-code/detectProduct`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shop,
        accessToken: shopify_access_token,
        productId
      }),
    });
    
    if (!response.ok) {
      throw new Error("Failed to detect HS code");
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || "Detection failed");
    }
    
    // Update product in state
    // setPendingProducts(prev => 
    //   prev.map(p => 
    //     p.id === productId 
    //       ? { 
    //           ...p, 
    //           suggestedCode: data.suggestedCode,
    //           confidence: data.confidence,
    //           alternativeCodes: data.alternativeCodes || [],
    //           hsStatus: 'pending'
    //         }
    //       : p
    //   )
    // );
    
    setPendingProducts(prev => 
      prev.map(p => 
        p.id === productId 
          ? { 
              ...p, 
              suggestedCode: data.suggestedCode,
              confidence: data.confidence,
              hsStatus: 'pending'
            }
          : p
      )
    );

    // Complete progress and mark as processed
    setDetectionProgress(100);
    setTimeout(() => {
      setDetectingProductId(null);
      setProcessedProductIds(prevIds => [...prevIds, productId]);
    }, 500);
    
  } catch (error) {
    console.error("Failed to detect HS code:", error);
    setDetectionProgress(0);
    setDetectingProductId(null);
  }
};




// Update handleApprove function to use the correct API path
const handleApprove = async (productId) => {
  try {
    // Get shop credentials
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

    const product = pendingProducts.find(p => p.id === productId);
    
    // Use the correct API path with /api prefix
    // await fetch(`${backend}/dutify/hs-code/save`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     shop,
    //     accessToken: shopify_access_token,
    //     productId,
    //     productName: product.name,
    //     hsCode: product.suggestedCode,
    //     confidence: product.confidence,
    //     status: "approved",
    //     alternativeCodes: product.alternativeCodes
    //   }),
    // });


    await fetch(`${backend}/dutify/hs-code/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shop,
        accessToken: shopify_access_token,
        productId,
        productName: product.name,
        hsCode: product.suggestedCode,
        confidence: product.confidence,
        status: "approved"
      }),
    });
    

    setApprovedProductIds(prevIds => [...prevIds, productId]);
    fetchCounts();
    
  } catch (error) {
    console.error("Failed to approve product:", error);
  }
};

// Update saveModifiedProduct function to use the correct API path
const handleModify = (productId) => {
  const product = pendingProducts.find(p => p.id === productId);
  setModifyingProduct(product);
  setModifiedHSCode(product.suggestedCode || "");
  setModifiedConfidence(product.confidence || "");
  setShowModifyModal(true);
};

const saveModifiedProduct = async () => {
  try {
    setSavingModification(true);
    
    // Get shop credentials
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

    // Use the correct API path with /api prefix
    // await fetch(`${backend}/dutify/hs-code/save`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     shop,
    //     accessToken: shopify_access_token,
    //     productId: modifyingProduct.id,
    //     productName: modifyingProduct.name,
    //     hsCode: modifiedHSCode,
    //     confidence: parseInt(modifiedConfidence),
    //     status: "modified",
    //     alternativeCodes: modifyingProduct.alternativeCodes
    //   }),
    // });

    await fetch(`${backend}/dutify/hs-code/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shop,
        accessToken: shopify_access_token,
        productId: modifyingProduct.id,
        productName: modifyingProduct.name,
        hsCode: modifiedHSCode,
        confidence: parseInt(modifiedConfidence),
        status: "modified"
      }),
    });

    // Update local state
    setPendingProducts(prev => 
      prev.map(p => 
        p.id === modifyingProduct.id 
          ? { ...p, suggestedCode: modifiedHSCode, confidence: parseInt(modifiedConfidence) }
          : p
      )
    );

    setModifiedProductIds(prevIds => [...prevIds, modifyingProduct.id]);
    setShowModifyModal(false);
    setModifyingProduct(null);
    setSavingModification(false);
    fetchCounts();
    
  } catch (error) {
    console.error("Failed to modify product:", error);
    setSavingModification(false);
  }
};

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return "text-green-600 bg-green-50";
    if (confidence >= 80) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800 border-green-200";
      case "modified": return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending": return "bg-orange-100 text-orange-800 border-orange-200";
      case "review": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNavigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              HS Code Detection
            </h1>
            <p className="text-slate-600">
              AI-powered classification for automated compliance
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Bulk Import
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Brain className="h-4 w-4 mr-2" />
              Train AI Model
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Classification Accuracy</p>
                  <p className="text-2xl font-bold text-slate-900">95.2%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Pending Review</p>
                  <p className="text-2xl font-bold text-slate-900">{pendingReviewCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Auto-Classified</p>
                  <p className="text-2xl font-bold text-slate-900">{autoClassifiedCount}</p>
                </div>
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Manual Overrides</p>
                  <p className="text-2xl font-bold text-slate-900">{manualOverridesCount}</p>
                </div>
                <Edit className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {detectingProductId && (
              <Card className="border-0 shadow-lg border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="animate-spin">
                      <Brain className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">AI Detection in Progress</h3>
                      <p className="text-sm text-blue-700">Analyzing product characteristics...</p>
                    </div>
                  </div>
                  <Progress value={detectionProgress} className="h-2" />
                  <div className="text-sm text-blue-600 mt-2">{detectionProgress}% complete</div>
                </CardContent>
              </Card>
            )}

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                  HS Code Classification ({filteredProducts.length})
                </CardTitle>
                <CardDescription>
                  Products awaiting HS code assignment or review
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={statusFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("all")}
                    >
                      All
                    </Button>
                    <Button
                      variant={statusFilter === "pending" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("pending")}
                    >
                      Pending
                    </Button>
                    <Button
                      variant={statusFilter === "approved" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("approved")}
                    >
                      Approved
                    </Button>
                    <Button
                      variant={statusFilter === "modified" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("modified")}
                    >
                      Modified
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {loading ? (
                    <div>Loading products...</div>
                  ) : error ? (
                    <div className="text-red-500">{error}</div>
                  ) : filteredProducts.length === 0 ? (
                    <div>No products found</div>
                  ) : (
                    filteredProducts.map((product) => (
                      <div key={product.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-slate-900">{product.name}</h3>
                              <Badge className={getStatusColor(getHSStatus(product))}>
                                HS Code: {getHSStatus(product)}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600 mb-2">{product.description}</p>
                            {processedProductIds.includes(product.id) && (
                              <Badge variant="outline">{product.category}</Badge>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handleAIDetection(product.id)}
                            disabled={detectingProductId === product.id || processedProductIds.includes(product.id)}
                            className="bg-gradient-to-r from-blue-600 to-purple-600"
                          >
                            {detectingProductId === product.id ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                Detecting...
                              </>
                            ) : processedProductIds.includes(product.id) ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Detected
                              </>
                            ) : (
                              <>
                                <Zap className="h-4 w-4 mr-1" />
                                Detect
                              </>
                            )}
                          </Button>
                        </div>

                        {processedProductIds.includes(product.id) && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-slate-700">AI Suggestion</span>
                              <Badge className={getConfidenceColor(product.confidence)}>
                                {product.confidence}% confidence
                              </Badge>
                            </div>
                            <div className="text-lg font-mono text-slate-900 mb-3">{product.suggestedCode}</div>


                            <div className="flex space-x-2 mt-3">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleApprove(product.id)}
                                disabled={approvedProductIds.includes(product.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {approvedProductIds.includes(product.id) ? "Approved" : "Approve"}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleModify(product.id)}
                                disabled={modifiedProductIds.includes(product.id)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                {modifiedProductIds.includes(product.id) ? "Modified" : "Modify"}
                              </Button>
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2 text-blue-600" />
                  Manual Classification
                </CardTitle>
                <CardDescription>
                  Search and assign HS codes manually
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Search HS codes..." />
                <Textarea placeholder="Product description..." rows={3} />
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                  <Search className="h-4 w-4 mr-2" />
                  Search HS Codes
                </Button>
              </CardContent>
            </Card>

            {/* <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Recent Classifications
                </CardTitle>
                <CardDescription>
                  Latest AI-powered classifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentClassifications.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 text-sm">{item.productName}</h4>
                        <p className="text-xs text-slate-600 font-mono">{item.hsCode}</p>
                        <p className="text-xs text-slate-500">{item.classifiedAt}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <Badge className={getConfidenceColor(item.confidence)}>
                          {item.confidence}%
                        </Badge>
                        <Badge className={getStatusColor(item.status)} size="sm">
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card> */}
          </div>
        </div>
      </div>

      {/* Modify Modal */}
      {showModifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Modify HS Code</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowModifyModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product</label>
                <p className="text-sm text-slate-600">{modifyingProduct?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">HS Code</label>
                <Input
                  value={modifiedHSCode}
                  onChange={(e) => setModifiedHSCode(e.target.value)}
                  placeholder="Enter HS code"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={saveModifiedProduct}
                  className="flex-1"
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowModifyModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HSCodes;
