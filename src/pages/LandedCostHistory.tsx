import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, X, Search, Calendar, Calculator } from "lucide-react";
import { DashboardNavigation } from "@/components/DashboardNavigation";

const LandedCostHistory = () => {
  const backend = import.meta.env.VITE_BACKEND_ENDPOINT;
  const [calculations, setCalculations] = useState([]);
  const [filteredCalculations, setFilteredCalculations] = useState([]);
  const [selectedCalculation, setSelectedCalculation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");

  const countries = [
    { code: "US", name: "United States", flag: "🇺🇸" },
    { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
    { code: "DE", name: "Germany", flag: "🇩🇪" },
    { code: "FR", name: "France", flag: "🇫🇷" },
    { code: "CA", name: "Canada", flag: "🇨🇦" },
    { code: "AU", name: "Australia", flag: "🇦🇺" },
    { code: "JP", name: "Japan", flag: "🇯🇵" },
  ];

  // Safe number formatter
  const formatNumber = (value) => {
    if (value === undefined || value === null) return "0.00";
    const num = parseFloat(value);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  // Get currency symbol
  const getCurrencySymbol = (currency) => {
    if (!currency) return "$";
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

  // Get currency name
  const getCurrencyName = (currency) => {
    if (!currency) return "";
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

  // Safe country name getter
  const getCountryName = (code) => {
    if (!code) return 'Unknown';
    const country = countries.find(c => c.code === code);
    return country ? `${country.flag} ${country.name}` : code;
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${backend}/dutify/landed-cost/history`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          const data = await response.json();
          const calcs = data.calculations || [];
          setCalculations(calcs);
          setFilteredCalculations(calcs);
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      }
    };

    fetchHistory();
  }, [backend]);

  useEffect(() => {
    if (!calculations.length) return;
    
    const filtered = calculations.filter(calc => {
      if (!calc) return false;
      
      const hsCode = calc.hs_code || "";
      const id = calc.id ? calc.id.toString() : "";
      
      return hsCode.toLowerCase().includes(searchTerm.toLowerCase()) || 
             id.includes(searchTerm);
    });

    if (sortBy === "date") {
      filtered.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      });
    } else if (sortBy === "cost") {
      filtered.sort((a, b) => {
        const costA = parseFloat(a.total_landed_cost || 0);
        const costB = parseFloat(b.total_landed_cost || 0);
        return costB - costA;
      });
    } else if (sortBy === "margin") {
      filtered.sort((a, b) => {
        const marginA = parseFloat(a.margin || 0);
        const marginB = parseFloat(b.margin || 0);
        return marginB - marginA;
      });
    }

    setFilteredCalculations(filtered);
  }, [searchTerm, sortBy, calculations]);

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNavigation />
      
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 sm:mb-8">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="self-start"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">
              Calculation History
            </h1>
            <p className="text-slate-600 text-sm sm:text-base">
              View all your landed cost calculations ({filteredCalculations.length})
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by HS Code or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={sortBy === "date" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("date")}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Date
            </Button>
            <Button
              variant={sortBy === "cost" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("cost")}
            >
              Cost
            </Button>
            <Button
              variant={sortBy === "margin" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("margin")}
            >
              Margin
            </Button>
          </div>
        </div>

        {/* Recent Calculations */}
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calculator className="h-5 w-5 mr-2 text-purple-600" />
              Recent Calculations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredCalculations.map((calc) => {
                if (!calc) return null;
                
                const currencySymbol = getCurrencySymbol(calc.currency);
                
                return (
                  <div
                    key={calc.id || Math.random().toString()}
                    className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedCalculation(calc)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-slate-900 text-sm">
                        {calc.hs_code || `Calculation #${calc.id || 'New'}`}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {formatNumber(calc.margin)}%
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div>Subtotal: {currencySymbol}{formatNumber(calc.product_value)}</div>
                      <div>Total: {currencySymbol}{formatNumber(calc.total_landed_cost)}</div>
                      <div>
                        {calc.created_at ? new Date(calc.created_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                );
              })}
              
            </div>
          </CardContent>
        </Card>

        {filteredCalculations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No calculations found</p>
          </div>
        )}
      </div>

      {/* Responsive Modal */}
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

export default LandedCostHistory;
