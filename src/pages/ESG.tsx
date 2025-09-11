import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Search, Zap, CheckCircle, AlertTriangle, RefreshCw, Brain, Leaf, Users, Shield } from "lucide-react";
import { DashboardNavigation } from "@/components/DashboardNavigation";
import { supabase } from "../lib/supabaseClient";

const ESG = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [processingProductId, setProcessingProductId] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [allProducts, setAllProducts] = useState([]);
  const [esgProducts, setEsgProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [generateEsgProduct, setGenerateEsgProduct] = useState(null);

  const backend = import.meta.env.VITE_BACKEND_ENDPOINT;

  const filteredProducts = useMemo(() => {
    if (!allProducts || !Array.isArray(allProducts)) return [];
    
    if (searchTerm) {
      return allProducts.filter(product =>
        product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.vendor?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return allProducts;
  }, [allProducts, searchTerm]);

  const getShopCredentials = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const email = user.email;
    const userType = user.type;

    if (!email) throw new Error("User not logged in");

    let shop, shopify_access_token;
    if (userType === "sub_user") {
      const { data: subUser } = await supabase.from("sub_users").select("owner_id").eq("email", email).single();
      if (!subUser) throw new Error("Sub-user not found");
      const { data: shopRow } = await supabase.from("shops").select("shopify_domain, shopify_access_token").eq("user_id", subUser.owner_id).single();
      if (!shopRow) throw new Error("Shop not found");
      shop = shopRow.shopify_domain;
      shopify_access_token = shopRow.shopify_access_token;
    } else {
      const { data: userData } = await supabase.from("users").select("id").eq("email", email).single();
      if (!userData) throw new Error("User not found");
      const { data: shopRow } = await supabase.from("shops").select("shopify_domain, shopify_access_token").eq("user_id", userData.id).single();
      if (!shopRow) throw new Error("Shop not found");
      shop = shopRow.shopify_domain;
      shopify_access_token = shopRow.shopify_access_token;
    }

    return { shop, shopify_access_token };
  };

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      const { shop, shopify_access_token } = await getShopCredentials();

      const productsRes = await fetch(`${backend}/shopify/getAllProducts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop, accessToken: shopify_access_token }),
      });

      if (!productsRes.ok) throw new Error("Failed to fetch products");

      const productsData = await productsRes.json();
      setAllProducts(productsData.products || []);

      // Fetch ESG data
      const { data: esgData } = await supabase.from("product_esg_scores").select("*");
      setEsgProducts(esgData || []);

      // Calculate summary
      if (esgData && esgData.length > 0) {
        const avgScore = esgData.reduce((sum, item) => sum + item.esg_score, 0) / esgData.length;
        const riskDistribution = esgData.reduce((acc, item) => {
          acc[item.risk_level] = (acc[item.risk_level] || 0) + 1;
          return acc;
        }, {});
        
        setSummary({
          averageESGScore: avgScore.toFixed(1),
          riskDistribution
        });
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setError("Failed to load products");
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProducts();
  }, []);

  const handleESGProcessing = async (productId) => {
    try {
      setProcessingProductId(productId);
      setProcessingProgress(0);

      const interval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 100);

      const { shop, shopify_access_token } = await getShopCredentials();

      const response = await fetch(`${backend}/shopify/esg/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop, accessToken: shopify_access_token, productId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process ESG");
      }

      setProcessingProgress(100);
      setTimeout(() => {
        setProcessingProductId(null);
        fetchAllProducts(); // Refresh data
      }, 500);
    } catch (error) {
      console.error("Failed to process ESG:", error);
      setProcessingProgress(0);
      setProcessingProductId(null);
      alert(error.message);
    }
  };

  const hasESGData = (productId) => {
    return esgProducts.some(esg => esg.product_id === productId.toString());
  };

  const getESGData = (productId) => {
    return esgProducts.find(esg => esg.product_id === productId.toString());
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case "low": return "bg-green-100 text-green-800 border-green-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "high": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getScoreColor = (score) => {
    if (score >= 7) return "text-green-600";
    if (score >= 5) return "text-yellow-600";
    return "text-red-600";
  };

  // ESG Generate Modal Component
  const ESGGenerateModal = ({ product, onClose }) => {
    const [vendorEmail, setVendorEmail] = useState("");
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [requestStatus, setRequestStatus] = useState(null);
    const [checkingStatus, setCheckingStatus] = useState(true);

    const getSuggestedVendors = (productType) => {
      const vendorSuggestions = {
        Electronics: ["Samsung", "LG Electronics", "Panasonic", "Sony", "Apple"],
        Clothing: ["Patagonia", "H&M Conscious", "Adidas", "Nike", "Puma"],
        Food: ["Nestlé", "Unilever", "General Mills", "Danone", "Kellogg's"],
        Beauty: ["L'Oréal", "Unilever", "P&G", "Johnson & Johnson", "Estée Lauder"],
        Home: ["IKEA", "Philips", "Whirlpool", "Electrolux", "Bosch"],
        default: ["Patagonia", "Unilever", "IKEA", "Philips", "Samsung"],
      };
      return vendorSuggestions[productType] || vendorSuggestions["default"];
    };

    const suggestedVendors = getSuggestedVendors(product?.productType);

    const getUserId = () => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user.id || user.email;
    };

    useEffect(() => {
      const checkRequestStatus = async () => {
        if (!product) return;
        
        setCheckingStatus(true);
        try {
          const userId = getUserId();
          const productId = product.id;
          const numericId = productId.toString().replace('gid://shopify/Product/', '');
          
          const response = await fetch(`${backend}/esg-request-status/${userId}/${productId}`);
          
          if (response.ok) {
            const data = await response.json();
            setRequestStatus(data);
          } else {
            // Fallback: Check database directly
            try {
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
            } catch (dbError) {
              console.log('Table may not exist yet:', dbError);
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
        const response = await fetch(`${backend}/api/send-esg-request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vendorEmail,
            productName: product.title,
            vendorName: product.vendor,
            userId,
            productId: product.id
          }),
        });

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

    if (checkingStatus) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="ml-2">Checking request status...</span>
            </div>
          </div>
        </div>
      );
    }

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
                <p className="font-medium mt-1">{product.title}</p>
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
    <div className="min-h-screen bg-slate-50">
      <DashboardNavigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">ESG Risk Assessment</h1>
            <p className="text-slate-600">Environmental, Social & Governance risk monitoring for your supply chain</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={fetchAllProducts} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </div>

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Average ESG Score</p>
                    <p className="text-2xl font-bold text-slate-900">{summary.averageESGScore || 0}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">High Risk</p>
                    <p className="text-2xl font-bold text-slate-900">{summary.riskDistribution?.high || 0}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Medium Risk</p>
                    <p className="text-2xl font-bold text-slate-900">{summary.riskDistribution?.medium || 0}</p>
                  </div>
                  <Zap className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Low Risk</p>
                    <p className="text-2xl font-bold text-slate-900">{summary.riskDistribution?.low || 0}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {processingProductId && (
          <Card className="border-0 shadow-lg border-blue-200 bg-blue-50 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="animate-spin">
                  <Brain className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">ESG Processing in Progress</h3>
                  <p className="text-sm text-blue-700">Analyzing ESG risk factors...</p>
                </div>
              </div>
              <Progress value={processingProgress} className="h-2" />
              <div className="text-sm text-blue-600 mt-2">{processingProgress}% complete</div>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
              All Products ({filteredProducts?.length || 0})
            </CardTitle>
            <CardDescription>Click "Get ESG Risk" to analyze each product</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>

            <div className="space-y-4">
              {loading ? (
                <div>Loading products...</div>
              ) : error ? (
                <div className="text-red-500">{error}</div>
              ) : !filteredProducts || filteredProducts.length === 0 ? (
                <div>No products found.</div>
              ) : (
                filteredProducts.map((product) => {
                  const esgData = getESGData(product.id);
                  const hasESG = hasESGData(product.id);

                  return (
                    <div key={product.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-slate-900">{product.title}</h3>
                            {hasESG && (
                              <Badge className={getRiskColor(esgData.risk_level)}>
                                {esgData.risk_level?.toUpperCase()} RISK
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{product.vendor}</p>
                          {hasESG && (
                            <p className="text-sm font-mono text-blue-700 mb-2">ESG Score: {esgData.esg_score}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {hasESG ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Processed
                            </Badge>
                          ) : (
                            <>
                              {/* <Button
                                size="sm"
                                onClick={() => handleESGProcessing(product.id)}
                                disabled={processingProductId === product.id}
                                className="bg-gradient-to-r from-green-600 to-blue-600"
                              >
                                {processingProductId === product.id ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <Brain className="h-4 w-4 mr-1" />
                                    Get ESG Risk
                                  </>
                                )}
                              </Button> */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setGenerateEsgProduct(product)}
                                className="bg-gradient-to-r from-green-600 to-blue-600"
                              >
                                <Shield className="h-3 w-3 mr-1" />
                                Generate ESG
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {hasESG && (
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="grid grid-cols-3 gap-4 mb-3">
                            <div className="text-center">
                              <div className="flex items-center justify-center mb-1">
                                <Leaf className="h-4 w-4 text-green-600 mr-1" />
                                <span className="text-xs text-slate-600">Environmental</span>
                              </div>
                              <div className={`text-lg font-bold ${getScoreColor(esgData.environment_score)}`}>
                                {esgData.environment_score}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center mb-1">
                                <Users className="h-4 w-4 text-blue-600 mr-1" />
                                <span className="text-xs text-slate-600">Social</span>
                              </div>
                              <div className={`text-lg font-bold ${getScoreColor(esgData.social_score)}`}>
                                {esgData.social_score}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center mb-1">
                                <Shield className="h-4 w-4 text-purple-600 mr-1" />
                                <span className="text-xs text-slate-600">Governance</span>
                              </div>
                              <div className={`text-lg font-bold ${getScoreColor(esgData.governance_score)}`}>
                                {esgData.governance_score}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <ESGGenerateModal
        product={generateEsgProduct}
        onClose={() => setGenerateEsgProduct(null)}
      />
    </div>
  );
};

export default ESG;
