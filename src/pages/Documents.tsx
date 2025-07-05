import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Download,
  Eye,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertTriangle,
  Globe,
  Truck,
  Shield,
} from "lucide-react";
import { DashboardNavigation } from "@/components/DashboardNavigation";

const Documents = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocumentType, setSelectedDocumentType] = useState("all");

  const documentTemplates = [
    {
      id: "1",
      name: "Commercial Invoice",
      description: "Standard invoice for international shipments",
      icon: FileText,
      color: "blue",
      fields: ["Product details", "HS codes", "Values", "Terms"],
    },
    {
      id: "2",
      name: "Certificate of Origin",
      description: "Certifies the country of manufacture",
      icon: Globe,
      color: "green",
      fields: [
        "Origin criteria",
        "Product classification",
        "Manufacturer details",
      ],
    },
    {
      id: "3",
      name: "Packing List",
      description: "Detailed shipment contents and packaging",
      icon: Truck,
      color: "purple",
      fields: ["Package details", "Weights", "Dimensions", "Contents"],
    },
    {
      id: "4",
      name: "ESG Statement",
      description: "Environmental and social compliance declaration",
      icon: Shield,
      color: "emerald",
      fields: ["Sustainability metrics", "Supply chain info", "Compliance"],
    },
  ];

  const recentDocuments = [
    {
      id: "1",
      name: "Commercial Invoice - Order #12345",
      type: "Commercial Invoice",
      destination: "United Kingdom",
      status: "ready",
      createdAt: "2 hours ago",
      orderValue: "$1,247.50",
    },
    {
      id: "2",
      name: "Certificate of Origin - EU Shipment",
      type: "Certificate of Origin",
      destination: "Germany",
      status: "pending",
      createdAt: "4 hours ago",
      orderValue: "$892.30",
    },
    {
      id: "3",
      name: "Packing List - Order #12344",
      type: "Packing List",
      destination: "Canada",
      status: "ready",
      createdAt: "6 hours ago",
      orderValue: "$2,156.75",
    },
    {
      id: "4",
      name: "ESG Statement - Q4 Report",
      type: "ESG Statement",
      destination: "Multiple",
      status: "review",
      createdAt: "1 day ago",
      orderValue: "$15,430.00",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "review":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return CheckCircle;
      case "pending":
        return Clock;
      case "review":
        return AlertTriangle;
      default:
        return FileText;
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
              Export Documentation
            </h1>
            <p className="text-slate-600">
              Auto-generate compliant export documentation
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Plus className="h-4 w-4 mr-2" />
              Create Document
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
                    Documents Generated
                  </p>
                  <p className="text-2xl font-bold text-slate-900">2,847</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">
                    Ready to Download
                  </p>
                  <p className="text-2xl font-bold text-slate-900">23</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Processing</p>
                  <p className="text-2xl font-bold text-slate-900">8</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Need Review</p>
                  <p className="text-2xl font-bold text-slate-900">5</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Document Templates */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Document Templates
                </CardTitle>
                <CardDescription>
                  Choose a template to generate export documentation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {documentTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className="border border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div
                            className={`p-3 rounded-lg bg-${template.color}-100`}
                          >
                            <template.icon
                              className={`h-6 w-6 text-${template.color}-600`}
                            />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {template.name}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {template.description}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs text-slate-500 font-medium">
                            Includes:
                          </p>
                          {template.fields.map((field, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="mr-1 mb-1 text-xs"
                            >
                              {field}
                            </Badge>
                          ))}
                        </div>
                        <Button className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600">
                          Generate Document
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Documents */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-purple-600" />
                  Recent Documents
                </CardTitle>
                <CardDescription>
                  Your recently generated export documentation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentDocuments.map((doc) => {
                    const StatusIcon = getStatusIcon(doc.status);
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center space-x-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          <StatusIcon className="h-6 w-6 text-slate-400" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-slate-900 truncate">
                              {doc.name}
                            </h3>
                            <Badge className={getStatusColor(doc.status)}>
                              {doc.status}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-slate-600">
                            <span>{doc.type}</span>
                            <span>•</span>
                            <span>{doc.destination}</span>
                            <span>•</span>
                            <span>{doc.orderValue}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Created {doc.createdAt}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Document Generator */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2 text-green-600" />
                  Quick Generator
                </CardTitle>
                <CardDescription>
                  Generate documents for specific orders
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Order number or ID..." />
                <Input placeholder="Destination country..." />
                <Button className="w-full bg-gradient-to-r from-green-600 to-blue-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Generate All Documents
                </Button>
              </CardContent>
            </Card>

            {/* Compliance Status */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-blue-600" />
                  Compliance Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                      US Customs
                    </span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Ready</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                      EU Standards
                    </span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Ready</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-900">
                      UK Requirements
                    </span>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    Pending
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Bulk Actions */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-purple-600" />
                  Bulk Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Download All Ready
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Monthly Report
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Compliance Check
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documents;
