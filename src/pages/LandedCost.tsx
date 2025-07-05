
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  RefreshCw
} from "lucide-react";
import { DashboardNavigation } from "@/components/DashboardNavigation";

const LandedCost = () => {
  const [calculation, setCalculation] = useState({
    productValue: "",
    quantity: "",
    shippingCost: "",
    insurance: "",
    destinationCountry: "",
    hsCode: "",
    currency: "USD"
  });

  const [results, setResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const countries = [
    { code: "US", name: "United States", flag: "🇺🇸" },
    { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
    { code: "DE", name: "Germany", flag: "🇩🇪" },
    { code: "FR", name: "France", flag: "🇫🇷" },
    { code: "CA", name: "Canada", flag: "🇨🇦" },
    { code: "AU", name: "Australia", flag: "🇦🇺" },
    { code: "JP", name: "Japan", flag: "🇯🇵" }
  ];

  const recentCalculations = [
    {
      id: "1",
      productName: "Wireless Headphones",
      destination: "United Kingdom",
      productValue: "$89.99",
      landedCost: "$127.45",
      margin: "41.7%",
      calculatedAt: "2 hours ago"
    },
    {
      id: "2",
      productName: "Cotton T-Shirt",
      destination: "Germany",
      productValue: "$29.99",
      landedCost: "$42.18",
      margin: "40.6%",
      calculatedAt: "4 hours ago"
    },
    {
      id: "3",
      productName: "Leather Wallet",
      destination: "Canada",
      productValue: "$79.99",
      landedCost: "$98.74",
      margin: "23.4%",
      calculatedAt: "1 day ago"
    }
  ];

  const handleCalculate = async () => {
    setIsCalculating(true);
    
    // Simulate API call
    setTimeout(() => {
      const productValue = parseFloat(calculation.productValue);
      const quantity = parseInt(calculation.quantity);
      const shippingCost = parseFloat(calculation.shippingCost);
      const insurance = parseFloat(calculation.insurance);

      const subtotal = productValue * quantity;
      const dutyRate = 0.12; // 12% example duty rate
      const vatRate = 0.20; // 20% example VAT rate
      
      const dutyAmount = subtotal * dutyRate;
      const vatBase = subtotal + dutyAmount + shippingCost;
      const vatAmount = vatBase * vatRate;
      const totalLandedCost = subtotal + dutyAmount + vatAmount + shippingCost + insurance;

      setResults({
        subtotal,
        dutyRate: dutyRate * 100,
        dutyAmount,
        vatRate: vatRate * 100,
        vatAmount,
        shippingCost,
        insurance,
        totalLandedCost,
        margin: ((totalLandedCost - subtotal) / subtotal) * 100
      });
      
      setIsCalculating(false);
    }, 2000);
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
                  <p className="text-sm text-slate-600 mb-1">Calculations Today</p>
                  <p className="text-2xl font-bold text-slate-900">47</p>
                </div>
                <Calculator className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Countries Covered</p>
                  <p className="text-2xl font-bold text-slate-900">50+</p>
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
                  <p className="text-2xl font-bold text-slate-900">12.5%</p>
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
                  <p className="text-2xl font-bold text-slate-900">+28%</p>
                </div>
                <DollarSign className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Calculator */}
          <div className="lg:col-span-2 space-y-6">
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
                  <h3 className="text-lg font-semibold text-slate-900">Product Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="productValue">Product Value</Label>
                      <Input
                        id="productValue"
                        placeholder="89.99"
                        value={calculation.productValue}
                        onChange={(e) => setCalculation(prev => ({ ...prev, productValue: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        placeholder="100"
                        value={calculation.quantity}
                        onChange={(e) => setCalculation(prev => ({ ...prev, quantity: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="hsCode">HS Code</Label>
                      <Input
                        id="hsCode"
                        placeholder="8518.30.20"
                        value={calculation.hsCode}
                        onChange={(e) => setCalculation(prev => ({ ...prev, hsCode: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={calculation.currency} onValueChange={(value) => setCalculation(prev => ({ ...prev, currency: value }))}>
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
                  <h3 className="text-lg font-semibold text-slate-900">Shipping & Destination</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="destinationCountry">Destination Country</Label>
                      <Select value={calculation.destinationCountry} onValueChange={(value) => setCalculation(prev => ({ ...prev, destinationCountry: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
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
                        onChange={(e) => setCalculation(prev => ({ ...prev, shippingCost: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="insurance">Insurance (Optional)</Label>
                      <Input
                        id="insurance"
                        placeholder="15.00"
                        value={calculation.insurance}
                        onChange={(e) => setCalculation(prev => ({ ...prev, insurance: e.target.value }))}
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
                        <span className="text-slate-700">Product Subtotal:</span>
                        <span className="font-medium">${results.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700">Duty ({results.dutyRate}%):</span>
                        <span className="font-medium">${results.dutyAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700">VAT ({results.vatRate}%):</span>
                        <span className="font-medium">${results.vatAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700">Shipping:</span>
                        <span className="font-medium">${results.shippingCost.toFixed(2)}</span>
                      </div>
                      {results.insurance > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-700">Insurance:</span>
                          <span className="font-medium">${results.insurance.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="p-4 bg-white rounded-lg border-2 border-green-300">
                        <div className="text-center">
                          <p className="text-sm text-slate-600 mb-1">Total Landed Cost</p>
                          <p className="text-3xl font-bold text-green-700">
                            ${results.totalLandedCost.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-slate-200">
                        <div className="text-center">
                          <p className="text-sm text-slate-600 mb-1">Cost Increase</p>
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
                    <span className="text-sm text-blue-900">Base Duty Rate</span>
                    <span className="font-medium text-blue-900">12%</span>
                  </div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-purple-900">VAT Rate</span>
                    <span className="font-medium text-purple-900">20%</span>
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-900">Processing Fee</span>
                    <span className="font-medium text-green-900">$15</span>
                  </div>
                </div>
                <div className="text-xs text-slate-600 mt-3">
                  * Rates may vary based on trade agreements and product classification
                </div>
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
                  {recentCalculations.map((calc) => (
                    <div key={calc.id} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-slate-900 text-sm">{calc.productName}</h4>
                        <Badge variant="outline" className="text-xs">{calc.margin}</Badge>
                      </div>
                      <div className="text-xs text-slate-600 space-y-1">
                        <div>Destination: {calc.destination}</div>
                        <div>{calc.productValue} → {calc.landedCost}</div>
                        <div>{calc.calculatedAt}</div>
                      </div>
                    </div>
                  ))}
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
                  Rates are estimates based on general tariff schedules. Actual costs may vary. 
                  Consult with a customs broker for precise calculations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandedCost;
