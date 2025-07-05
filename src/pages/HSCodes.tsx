
import { useState } from "react";
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
  Brain
} from "lucide-react";
import { DashboardNavigation } from "@/components/DashboardNavigation";

const HSCodes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionProgress, setDetectionProgress] = useState(0);

  const pendingProducts = [
    {
      id: "1",
      name: "Wireless Gaming Mouse",
      description: "High-precision wireless gaming mouse with RGB lighting and programmable buttons",
      category: "Electronics",
      suggestedCode: "8471.60.20",
      confidence: 92,
      alternativeCodes: [
        { code: "8471.60.90", confidence: 78, description: "Other input units" },
        { code: "8473.30.20", confidence: 65, description: "Computer accessories" }
      ]
    },
    {
      id: "2",
      name: "Bamboo Cutting Board",
      description: "Eco-friendly bamboo cutting board with juice groove, 18x12 inches",
      category: "Home & Kitchen",
      suggestedCode: "4419.90.90",
      confidence: 95,
      alternativeCodes: [
        { code: "4419.11.00", confidence: 82, description: "Bamboo tableware" },
        { code: "4421.90.97", confidence: 71, description: "Other wood articles" }
      ]
    },
    {
      id: "3",
      name: "Ceramic Coffee Mug",
      description: "Hand-glazed ceramic coffee mug, 12oz capacity, dishwasher safe",
      category: "Home & Kitchen",
      suggestedCode: "6912.00.48",
      confidence: 88,
      alternativeCodes: [
        { code: "6912.00.10", confidence: 75, description: "Bone china tableware" },
        { code: "6912.00.39", confidence: 69, description: "Other ceramic tableware" }
      ]
    }
  ];

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

  const handleAIDetection = async (productId: string) => {
    setIsDetecting(true);
    setDetectionProgress(0);
    
    // Simulate AI detection process
    const interval = setInterval(() => {
      setDetectionProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDetecting(false);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-600 bg-green-50";
    if (confidence >= 80) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800 border-green-200";
      case "review": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "pending": return "bg-orange-100 text-orange-800 border-orange-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
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

        {/* Stats Cards */}
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
                  <p className="text-2xl font-bold text-slate-900">23</p>
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
                  <p className="text-2xl font-bold text-slate-900">1,124</p>
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
                  <p className="text-2xl font-bold text-slate-900">47</p>
                </div>
                <Edit className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Pending Classifications */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Detection Status */}
            {isDetecting && (
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
                  Pending HS Code Classification
                </CardTitle>
                <CardDescription>
                  Products awaiting HS code assignment or review
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingProducts.map((product) => (
                    <div key={product.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-900 mb-1">{product.name}</h3>
                          <p className="text-sm text-slate-600 mb-2">{product.description}</p>
                          <Badge variant="outline">{product.category}</Badge>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleAIDetection(product.id)}
                          disabled={isDetecting}
                          className="bg-gradient-to-r from-blue-600 to-purple-600"
                        >
                          <Zap className="h-4 w-4 mr-1" />
                          Detect
                        </Button>
                      </div>

                      {/* AI Suggestions */}
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">AI Suggestion</span>
                          <Badge className={getConfidenceColor(product.confidence)}>
                            {product.confidence}% confidence
                          </Badge>
                        </div>
                        <div className="text-lg font-mono text-slate-900 mb-3">{product.suggestedCode}</div>
                        
                        {/* Alternative codes */}
                        <div className="space-y-2">
                          <span className="text-xs text-slate-600">Alternative classifications:</span>
                          {product.alternativeCodes.map((alt, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span className="font-mono text-slate-700">{alt.code}</span>
                              <span className="text-slate-600">{alt.confidence}%</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex space-x-2 mt-3">
                          <Button size="sm" variant="outline">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4 mr-1" />
                            Modify
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Manual Classification Tool */}
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
                  Search Codes
                </Button>
              </CardContent>
            </Card>

            {/* Recent Classifications */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Recent Classifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentClassifications.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {item.productName}
                        </p>
                        <p className="text-xs text-slate-600">{item.classifiedAt}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                        <span className="text-xs font-mono text-slate-700">
                          {item.hsCode}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Model Performance */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-purple-600" />
                  AI Model Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">Overall Accuracy</span>
                    <span className="text-sm font-medium">95.2%</span>
                  </div>
                  <Progress value={95.2} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">Electronics</span>
                    <span className="text-sm font-medium">97.1%</span>
                  </div>
                  <Progress value={97.1} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">Apparel</span>
                    <span className="text-sm font-medium">93.8%</span>
                  </div>
                  <Progress value={93.8} className="h-2" />
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retrain Model
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HSCodes;
