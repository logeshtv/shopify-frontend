import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  DollarSign,
  Calculator,
  Globe,
  TrendingUp,
  AlertTriangle,
  Info,
  Download,
  Save,
  RefreshCw,
  X,
  ChevronDown,
  Search,
  Package,
} from "lucide-react";
import { DashboardNavigation } from "@/components/DashboardNavigation";
import { toast } from "@/components/ui/use-toast";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Utility function to format numbers with commas
const formatNumber = (num: number | string): string => {
  return Number(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const LandedCost = () => {
  const backend = import.meta.env.VITE_BACKEND_ENDPOINT;

  const [calculation, setCalculation] = useState({
    productValue: "",
    quantity: "",
    shippingCost: "",
    insurance: "",
    originCountry: "US",
    destinationCountry: "",
    hsCode: "",
    description: "",
    currency: "USD",
  });

  const [results, setResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [recentCalculations, setRecentCalculations] = useState([]);
  const [selectedCalculation, setSelectedCalculation] = useState(null);
  const [showAllCalculations, setShowAllCalculations] = useState(false);
  const [stats, setStats] = useState({
    calculationsToday: 0,
    avgDutyRate: "0",
    avgMargin: "0",
  });

  // Product search states
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Only supported countries by Dutify API
  const supportedCountries = [
    { code: "US", name: "United States", flag: "🇺🇸" },
    { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
    { code: "DE", name: "Germany", flag: "🇩🇪" },
    { code: "FR", name: "France", flag: "🇫🇷" },
    { code: "CA", name: "Canada", flag: "🇨🇦" },
    { code: "AU", name: "Australia", flag: "🇦🇺" },
    { code: "JP", name: "Japan", flag: "🇯🇵" },
    { code: "IT", name: "Italy", flag: "🇮🇹" },
    { code: "ES", name: "Spain", flag: "🇪🇸" },
    { code: "NL", name: "Netherlands", flag: "🇳🇱" },
    { code: "BE", name: "Belgium", flag: "🇧🇪" },
    { code: "AT", name: "Austria", flag: "🇦🇹" },
    { code: "IE", name: "Ireland", flag: "🇮🇪" },
    { code: "PT", name: "Portugal", flag: "🇵🇹" },
    { code: "GR", name: "Greece", flag: "🇬🇷" },
    { code: "FI", name: "Finland", flag: "🇫🇮" },
    { code: "SE", name: "Sweden", flag: "🇸🇪" },
    { code: "DK", name: "Denmark", flag: "🇩🇰" },
    { code: "NO", name: "Norway", flag: "🇳🇴" },
    { code: "KR", name: "South Korea", flag: "🇰🇷" },
    { code: "SG", name: "Singapore", flag: "🇸🇬" },
    { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  ];

  const getCurrencySymbol = (currency) => {
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CAD: 'C$',
      AUD: 'A$',
      CNY: '¥',
      INR: '₹'
    };
    return symbols[currency] || currency + ' ';
  };
  
  const getCurrencyName = (currency) => {
    const names = {
      USD: 'US Dollar',
      EUR: 'Euro',
      GBP: 'British Pound',
      JPY: 'Japanese Yen',
      CAD: 'Canadian Dollar',
      AUD: 'Australian Dollar',
      CNY: 'Chinese Yuan',
      INR: 'Indian Rupee'
    };
    return names[currency] || '';
  };

  const getCountryName = (code) => {
    const country = supportedCountries.find((c) => c.code === code);
    return country ? `${country.flag} ${country.name}` : code;
  };

  const displayedCalculations = showAllCalculations
    ? recentCalculations
    : recentCalculations.slice(0, 3);

  // Search for approved/modified products
  const searchProducts = async () => {
    if (!productSearchTerm.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
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

      const response = await fetch(`${backend}/dutify/products/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          shop, 
          accessToken: shopify_access_token, 
          searchTerm: productSearchTerm 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.products || []);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error("Failed to search products:", error);
      toast({
        title: "Search Failed",
        description: "Failed to search products",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Auto-fill form with selected product
  const selectProduct = (product) => {
    setCalculation(prev => ({
      ...prev,
      hsCode: product.hsCode || "",
      description: product.title || "",
    }));
    setShowSearchResults(false);
    setProductSearchTerm("");
    toast({
      title: "Product Selected",
      description: `Auto-filled HS Code and description for "${product.title}"`,
    });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${backend}/dutify/landed-cost/history`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          console.error("Response not ok:", response.status);
          return;
        }

        const data = await response.json();
        setRecentCalculations(data.calculations || []);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      }
    };

    fetchHistory();
  }, [results, backend]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${backend}/dutify/landed-cost/stats`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };

    fetchStats();
  }, [backend, results]);

  const handleCalculate = async () => {
    setIsCalculating(true);

    try {
      if (!supportedCountries.find(c => c.code === calculation.originCountry)) {
        toast({
          title: "Unsupported Country",
          description: `Origin country "${calculation.originCountry}" is not supported by the API.`,
          variant: "destructive"
        });
        setIsCalculating(false);
        return;
      }

      if (!supportedCountries.find(c => c.code === calculation.destinationCountry)) {
        toast({
          title: "Unsupported Country",
          description: `Destination country "${calculation.destinationCountry}" is not supported by the API.`,
          variant: "destructive"
        });
        setIsCalculating(false);
        return;
      }

      const response = await fetch(`${backend}/dutify/landed-cost/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(calculation),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to calculate landed cost");
      }

      const data = await response.json();
      
      const dutifyData = data.dutifyResponse;
      const attributes = dutifyData.data?.attributes || {};
      
      const calculationResults = {
        subtotal: parseFloat(calculation.productValue) * parseInt(calculation.quantity),
        dutyRate: data.data?.item_duty_rate || 0,
        dutyAmount: parseFloat(attributes.duty_total || 0),
        vatRate: data.data?.item_vat_rate || 0,
        vatAmount: parseFloat(attributes.sales_tax_total || 0),
        shippingCost: parseFloat(calculation.shippingCost) || 0,
        insurance: parseFloat(calculation.insurance) || 0,
        totalLandedCost: parseFloat(attributes.landed_cost_total || 0),
        margin: data.data?.margin || 0,
      };

      setResults(calculationResults);
    } catch (error) {
      console.error("Failed to calculate landed cost:", error);
      toast({
        title: "Calculation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNavigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Landed Cost Calculator
            </h1>
            <p className="text-slate-600">
              Calculate import taxes, duties, and total landed costs
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Results
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">
                    Calculations Today
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {stats.calculationsToday}
                  </p>
                </div>
                <Calculator className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">
                    Countries Covered
                  </p>
                  <p className="text-2xl font-bold text-slate-900">{supportedCountries.length}</p>
                </div>
                <Globe className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Avg. Duty Rate</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {stats.avgDutyRate}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Cost Impact</p>
                  <p className="text-2xl font-bold text-slate-900">
                    +{stats.avgMargin}%
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Calculator */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Search */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2 text-green-600" />
                  Search Approved Products
                </CardTitle>
                <CardDescription>
                  Search for approved/modified products to auto-fill HS code and description
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search products by name, description, or HS code..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchProducts()}
                  />
                  <Button 
                    onClick={searchProducts} 
                    disabled={isSearching}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSearching ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {showSearchResults && (
                  <div className="border rounded-lg max-h-60 overflow-y-auto">
                    {searchResults.length > 0 ? (
                      searchResults.map((product) => (
                        <div
                          key={product.id}
                          className="p-3 border-b hover:bg-slate-50 cursor-pointer flex items-center gap-3"
                          onClick={() => selectProduct(product)}
                        >
                          {product.image && (
                            <img 
                              src={product.image} 
                              alt={product.title}
                              className="w-10 h-10 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <div className="font-medium text-sm">{product.title}</div>
                            <div className="text-xs text-slate-600">
                              HS Code: {product.hsCode || 'N/A'}
                            </div>
                            <Badge 
                              variant={product.hsStatus === 'approved' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {product.hsStatus}
                            </Badge>
                          </div>
                          <Package className="h-4 w-4 text-slate-400" />
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-slate-500">
                        No approved/modified products found
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2 text-blue-600" />
                  Landed Cost Calculator
                </CardTitle>
                <CardDescription>
                  Calculate total landed costs including duties, taxes, and fees
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Product Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Product Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="productValue">Product Value</Label>
                      <Input
                        id="productValue"
                        placeholder="89.99"
                        value={calculation.productValue}
                        onChange={(e) =>
                          setCalculation((prev) => ({
                            ...prev,
                            productValue: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        placeholder="100"
                        value={calculation.quantity}
                        onChange={(e) =>
                          setCalculation((prev) => ({
                            ...prev,
                            quantity: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="hsCode">HS Code</Label>
                      <Input
                        id="hsCode"
                        placeholder="8518.30.20"
                        value={calculation.hsCode}
                        onChange={(e) =>
                          setCalculation((prev) => ({
                            ...prev,
                            hsCode: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        placeholder="Product description"
                        value={calculation.description}
                        onChange={(e) =>
                          setCalculation((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={calculation.currency}
                        onValueChange={(value) =>
                          setCalculation((prev) => ({
                            ...prev,
                            currency: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="CAD">CAD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Shipping Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Shipping & Destination
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="originCountry">
                        Origin Country
                      </Label>
                      <Select
                        value={calculation.originCountry}
                        onValueChange={(value) =>
                          setCalculation((prev) => ({
                            ...prev,
                            originCountry: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select origin country" />
                        </SelectTrigger>
                        <SelectContent>
                          {supportedCountries.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.flag} {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="destinationCountry">
                        Destination Country
                      </Label>
                      <Select
                        value={calculation.destinationCountry}
                        onValueChange={(value) =>
                          setCalculation((prev) => ({
                            ...prev,
                            destinationCountry: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select destination country" />
                        </SelectTrigger>
                        <SelectContent>
                          {supportedCountries.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.flag} {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="shippingCost">Shipping Cost</Label>
                      <Input
                        id="shippingCost"
                        placeholder="25.00"
                        value={calculation.shippingCost}
                        onChange={(e) =>
                          setCalculation((prev) => ({
                            ...prev,
                            shippingCost: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="insurance">Insurance (Optional)</Label>
                      <Input
                        id="insurance"
                        placeholder="15.00"
                        value={calculation.insurance}
                        onChange={(e) =>
                          setCalculation((prev) => ({
                            ...prev,
                            insurance: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleCalculate}
                  disabled={isCalculating}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-lg py-6"
                >
                  {isCalculating ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-5 w-5 mr-2" />
                      Calculate Landed Cost
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            {results && (
              <Card className="border-0 shadow-lg border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-900">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Calculation Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700">
                          Product Subtotal:
                        </span>
                        <span className="font-medium">
                          ${results.subtotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700">
                          Duty ({results.dutyRate.toFixed(1)}%):
                        </span>
                        <span className="font-medium">
                          ${results.dutyAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700">
                          VAT ({results.vatRate.toFixed(1)}%):
                        </span>
                        <span className="font-medium">
                          ${results.vatAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700">Shipping:</span>
                        <span className="font-medium">
                          ${results.shippingCost.toFixed(2)}
                        </span>
                      </div>
                      {results.insurance > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-700">Insurance:</span>
                          <span className="font-medium">
                            ${results.insurance.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="p-4 bg-white rounded-lg border-2 border-green-300">
                        <div className="text-center">
                          <p className="text-sm text-slate-600 mb-1">
                            Total Landed Cost
                          </p>
                          <p className="text-3xl font-bold text-green-700">
                            ${results.totalLandedCost.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-slate-200">
                        <div className="text-center">
                          <p className="text-sm text-slate-600 mb-1">
                            Cost Increase
                          </p>
                          <p className="text-xl font-semibold text-orange-600">
                            +{results.margin.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Rate Information */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="h-5 w-5 mr-2 text-blue-600" />
                  Rate Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-900">
                      Base Duty Rate
                    </span>
                    <span className="font-medium text-blue-900">Varies by country</span>
                  </div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-purple-900">VAT Rate</span>
                    <span className="font-medium text-purple-900">Country specific</span>
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-900">
                      Processing Fee
                    </span>
                    <span className="font-medium text-green-900">Included</span>
                  </div>
                </div>
                <div className="text-xs text-slate-600 mt-3">
                  * Rates may vary based on trade agreements and product
                  classification
                </div>
              </CardContent>
            </Card>

            {/* Supported Countries */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2 text-green-600" />
                  Supported Countries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {supportedCountries.map((country) => (
                    <Badge key={country.code} variant="outline">
                      {country.flag} {country.code}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-slate-600 mt-3">
                  Only these countries are supported by the Dutify API
                </p>
              </CardContent>
            </Card>

            {/* Recent Calculations */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2 text-purple-600" />
                  Recent Calculations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {displayedCalculations.map((calc) => (
                    <div
                      key={calc.id}
                      className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedCalculation(calc)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-slate-900 text-sm">
                          {calc.hs_code || `Calculation #${calc.id}`}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {calc.margin.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-600 space-y-1">
                        <div>Subtotal: ${calc.product_value.toFixed(2)}</div>
                        <div>Total: ${calc.total_landed_cost.toFixed(2)}</div>
                        <div>
                          {new Date(calc.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {recentCalculations.length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        (window.location.href = "/landed-cost-history")
                      }
                    >
                      View All ({recentCalculations.length})
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card className="border-0 shadow-lg border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-900">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Important Notice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-yellow-800">
                  Only supported countries can be used for calculations. China (CN) and other countries not listed are not supported by the API.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Popup Modal */}
      {selectedCalculation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 truncate pr-4">
                  {selectedCalculation.hs_code || `Calculation #${selectedCalculation.id || 'New'}`}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCalculation(null)}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Input Data</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label className="text-xs sm:text-sm">Product Value</Label>
                        <div className="text-sm sm:text-base font-medium">
                          {getCurrencySymbol(selectedCalculation.input_currency || selectedCalculation.currency)}
                          {formatNumber(selectedCalculation.product_value)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm">Quantity</Label>
                        <div className="text-sm sm:text-base font-medium">
                          {selectedCalculation.quantity || 0}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm">HS Code</Label>
                        <div className="text-sm sm:text-base font-medium">
                          {selectedCalculation.hs_code || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm">Currency</Label>
                        <div className="text-sm sm:text-base font-medium">
                          {selectedCalculation.input_currency || selectedCalculation.currency} 
                          {getCurrencyName(selectedCalculation.input_currency || selectedCalculation.currency)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm">Origin</Label>
                        <div className="text-sm sm:text-base font-medium">
                          {getCountryName(selectedCalculation.origin_country)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm">Destination</Label>
                        <div className="text-sm sm:text-base font-medium">
                          {getCountryName(selectedCalculation.destination_country)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm">Shipping Cost</Label>
                        <div className="text-sm sm:text-base font-medium">
                          {getCurrencySymbol(selectedCalculation.input_currency || selectedCalculation.currency)}
                          {formatNumber(selectedCalculation.shipping_cost)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm">Insurance</Label>
                        <div className="text-sm sm:text-base font-medium">
                          {getCurrencySymbol(selectedCalculation.input_currency || selectedCalculation.currency)}
                          {formatNumber(selectedCalculation.insurance)}
                        </div>
                      </div>
                      {selectedCalculation.description && (
                        <div className="sm:col-span-2">
                          <Label className="text-xs sm:text-sm">Description</Label>
                          <div className="text-sm sm:text-base font-medium">
                            {selectedCalculation.description}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Calculation Results</CardTitle>
                    {selectedCalculation.input_currency !== selectedCalculation.currency && (
                      <div className="text-xs text-slate-500 mt-1">
                        Total Landed Cost shown in {selectedCalculation.currency}, other values in {selectedCalculation.input_currency || selectedCalculation.currency}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between text-sm sm:text-base">
                        <span>Product Value:</span>
                        <span className="font-medium">
                          {getCurrencySymbol(selectedCalculation.input_currency )}
                          {formatNumber(selectedCalculation.product_value)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base">
                        <span>Duty ({formatNumber(selectedCalculation.item_duty_rate)}%):</span>
                        <span className="font-medium">
                          {getCurrencySymbol(selectedCalculation.currency)}
                          {formatNumber(selectedCalculation.item_duty_amount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base">
                        <span>VAT ({formatNumber(selectedCalculation.item_vat_rate)}%):</span>
                        <span className="font-medium">
                          {getCurrencySymbol(selectedCalculation.currency)}
                          {formatNumber(selectedCalculation.item_vat_amount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base">
                        <span>Total Duties:</span>
                        <span className="font-medium">
                          {getCurrencySymbol(selectedCalculation.currency)}
                          {formatNumber(selectedCalculation.total_duties)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base">
                        <span>Total Taxes:</span>
                        <span className="font-medium">
                          {getCurrencySymbol(selectedCalculation.currency)}
                          {formatNumber(selectedCalculation.total_taxes)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base">
                        <span>Total Fees:</span>
                        <span className="font-medium">
                          {getCurrencySymbol(selectedCalculation.currency)}
                          {formatNumber(selectedCalculation.total_fees)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base">
                        <span>Shipping:</span>
                        <span className="font-medium">
                          {getCurrencySymbol(selectedCalculation.currency)}
                          {formatNumber(selectedCalculation.shipping_cost)}
                        </span>
                      </div>
                      {parseFloat(selectedCalculation.insurance || 0) > 0 && (
                        <div className="flex justify-between text-sm sm:text-base">
                          <span>Insurance:</span>
                          <span className="font-medium">
                            {getCurrencySymbol(selectedCalculation.currency)}
                            {formatNumber(selectedCalculation.insurance)}
                          </span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-base sm:text-lg font-bold">
                        <span>Total Landed Cost:</span>
                        <span>
                          {getCurrencySymbol(selectedCalculation.currency)}
                          {formatNumber(selectedCalculation.total_landed_cost)}
                        </span>
                      </div>
                      {selectedCalculation.margin && (
                        <div className="flex justify-between text-orange-600 font-semibold text-sm sm:text-base">
                          <span>Cost Increase:</span>
                          <span>+{formatNumber(selectedCalculation.margin)}%</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandedCost;
