
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Globe, 
  Leaf, 
  Users, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw,
  Download,
  Eye
} from "lucide-react";
import { DashboardNavigation } from "@/components/DashboardNavigation";

const ESG = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const esgMetrics = {
    environmental: {
      score: 72,
      trend: "up",
      change: "+5",
      metrics: [
        { name: "Carbon Footprint", value: 68, unit: "CO2e tons", risk: "medium" },
        { name: "Water Usage", value: 78, unit: "liters/unit", risk: "low" },
        { name: "Waste Reduction", value: 85, unit: "% recycled", risk: "low" },
        { name: "Renewable Energy", value: 45, unit: "% of total", risk: "high" }
      ]
    },
    social: {
      score: 84,
      trend: "up",
      change: "+3",
      metrics: [
        { name: "Fair Labor", value: 92, unit: "compliance %", risk: "low" },
        { name: "Worker Safety", value: 88, unit: "incident rate", risk: "low" },
        { name: "Community Impact", value: 76, unit: "rating", risk: "medium" },
        { name: "Diversity & Inclusion", value: 82, unit: "% score", risk: "low" }
      ]
    },
    governance: {
      score: 91,
      trend: "stable",
      change: "0",
      metrics: [
        { name: "Supply Chain Transparency", value: 95, unit: "% tracked", risk: "low" },
        { name: "Compliance Score", value: 94, unit: "% compliant", risk: "low" },
        { name: "Ethics Training", value: 89, unit: "% completed", risk: "low" },
        { name: "Risk Management", value: 86, unit: "framework score", risk: "low" }
      ]
    }
  };

  const riskProducts = [
    {
      id: "1",
      name: "Premium Leather Jacket",
      category: "Apparel",
      riskLevel: "high",
      riskScore: 78,
      issues: ["Unverified supplier", "High carbon footprint", "Animal welfare concerns"],
      supplier: "TannCorp Industries",
      lastAssessed: "2 days ago"
    },
    {
      id: "2",
      name: "Cotton T-Shirt Basic",
      category: "Apparel",
      riskLevel: "medium",
      riskScore: 45,
      issues: ["Water usage above average", "Limited traceability"],
      supplier: "EcoTextiles Ltd",
      lastAssessed: "1 week ago"
    },
    {
      id: "3",
      name: "Wireless Earbuds",
      category: "Electronics",
      riskLevel: "medium",
      riskScore: 52,
      issues: ["Conflict minerals potential", "E-waste concerns"],
      supplier: "TechAssembly Co",
      lastAssessed: "3 days ago"
    },
    {
      id: "4",
      name: "Bamboo Phone Case",
      category: "Accessories",
      riskLevel: "low",
      riskScore: 18,
      issues: ["Minor packaging concerns"],
      supplier: "GreenTech Solutions",
      lastAssessed: "1 day ago"
    }
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "bg-green-100 text-green-800 border-green-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "high": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down": return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <BarChart3 className="h-4 w-4 text-slate-600" />;
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
              ESG Risk Assessment
            </h1>
            <p className="text-slate-600">
              Environmental, Social & Governance risk monitoring for your supply chain
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
            <Button className="bg-gradient-to-r from-green-600 to-blue-600">
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* ESG Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Leaf className="h-6 w-6 text-green-600" />
                  <h3 className="font-semibold text-slate-900">Environmental</h3>
                </div>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(esgMetrics.environmental.trend)}
                  <span className="text-sm text-slate-600">{esgMetrics.environmental.change}</span>
                </div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(esgMetrics.environmental.score)}`}>
                  {esgMetrics.environmental.score}
                </div>
                <div className="text-sm text-slate-600">ESG Score</div>
              </div>
              <Progress value={esgMetrics.environmental.score} className="mt-4" />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-6 w-6 text-blue-600" />
                  <h3 className="font-semibold text-slate-900">Social</h3>
                </div>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(esgMetrics.social.trend)}
                  <span className="text-sm text-slate-600">{esgMetrics.social.change}</span>
                </div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(esgMetrics.social.score)}`}>
                  {esgMetrics.social.score}
                </div>
                <div className="text-sm text-slate-600">ESG Score</div>
              </div>
              <Progress value={esgMetrics.social.score} className="mt-4" />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-6 w-6 text-purple-600" />
                  <h3 className="font-semibold text-slate-900">Governance</h3>
                </div>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(esgMetrics.governance.trend)}
                  <span className="text-sm text-slate-600">{esgMetrics.governance.change}</span>
                </div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(esgMetrics.governance.score)}`}>
                  {esgMetrics.governance.score}
                </div>
                <div className="text-sm text-slate-600">ESG Score</div>
              </div>
              <Progress value={esgMetrics.governance.score} className="mt-4" />
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Detailed Metrics */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                  Detailed ESG Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="environmental">Environmental</TabsTrigger>
                    <TabsTrigger value="social">Social</TabsTrigger>
                    <TabsTrigger value="governance">Governance</TabsTrigger>
                  </TabsList>
                  
                  {Object.entries(esgMetrics).map(([category, data]) => (
                    <TabsContent key={category} value={category} className="space-y-4 mt-6">
                      {data.metrics.map((metric, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-slate-900">{metric.name}</h4>
                              <Badge className={getRiskColor(metric.risk)}>
                                {metric.risk} risk
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4">
                              <Progress value={metric.value} className="flex-1" />
                              <span className="text-sm text-slate-600 min-w-0">
                                {metric.value} {metric.unit}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Risk Products */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                  High-Risk Products
                </CardTitle>
                <CardDescription>
                  Products requiring immediate attention for ESG compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {riskProducts.map((product) => (
                    <div key={product.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-slate-900 mb-1">{product.name}</h3>
                          <div className="flex items-center space-x-2 text-sm text-slate-600">
                            <span>{product.category}</span>
                            <span>•</span>
                            <span>{product.supplier}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getRiskColor(product.riskLevel)}>
                            {product.riskLevel} risk
                          </Badge>
                          <span className="text-sm font-mono text-slate-700">
                            {product.riskScore}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm text-slate-600">Key Issues:</p>
                        <div className="flex flex-wrap gap-2">
                          {product.issues.map((issue, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {issue}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xs text-slate-500">
                          Last assessed: {product.lastAssessed}
                        </span>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            Reassess
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
            {/* Overall Risk Summary */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2 text-green-600" />
                  Risk Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium text-red-900">High Risk</span>
                  </div>
                  <Badge className="bg-red-100 text-red-800">12 products</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-900">Medium Risk</span>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">34 products</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Low Risk</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">1,201 products</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Compliance Alerts */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                  Compliance Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 border border-red-200 bg-red-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900">
                        Supplier Audit Overdue
                      </p>
                      <p className="text-xs text-red-700">
                        TannCorp Industries audit expired 30 days ago
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">
                        Carbon Footprint Increase
                      </p>
                      <p className="text-xs text-yellow-700">
                        15% increase detected in last quarter
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Training Reminder
                      </p>
                      <p className="text-xs text-blue-700">
                        Annual ESG training due in 2 weeks
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Run Full Assessment
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export ESG Report
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Update Risk Framework
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Schedule Supplier Audit
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ESG;
