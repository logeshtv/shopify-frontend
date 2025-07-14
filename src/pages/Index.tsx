
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, BarChart3, FileText, Globe, Zap, CheckCircle, Star, Users, TrendingUp } from "lucide-react";

const Index = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const features = [
    {
      icon: Shield,
      title: "Automated HS Code Detection",
      description: "AI-powered classification with 95%+ accuracy for seamless customs compliance"
    },
    {
      icon: FileText,
      title: "Export Documentation",
      description: "Auto-generate commercial invoices, certificates of origin, and packing lists"
    },
    {
      icon: BarChart3,
      title: "Landed Cost Estimation",
      description: "Calculate import taxes, duties, and total landed costs for any destination"
    },
    {
      icon: Globe,
      title: "ESG Risk Assessment",
      description: "Supply chain risk analysis with environmental and social impact scoring"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      company: "EcoStyle Co.",
      text: "ShopifyQ reduced our compliance processing time by 80%. Game-changer for our international expansion.",
      rating: 5
    },
    {
      name: "Marcus Williams",
      company: "TechGear Plus",
      text: "The HS code detection is incredibly accurate. We've eliminated manual classification errors completely.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ShopifyQ
              </span>
            </div>
            
            <div className="hidden md:flex space-x-8">
              <Link to="/dashboard" className="text-slate-600 hover:text-blue-600 transition-colors">Dashboard</Link>
              <Link to="/pricing" className="text-slate-600 hover:text-blue-600 transition-colors">Pricing</Link>
              <Link to="/about" className="text-slate-600 hover:text-blue-600 transition-colors">About</Link>
            </div>

            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" className="text-slate-600">Sign In</Button>
              </Link>
              <Link to="/dashboard">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-700 border-blue-200">
            🚀 AI-Powered Compliance Platform
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight">
            Automate Your
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}Shopify Global Trade
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            ShopifyQ eliminates compliance headaches for DTC brands with AI-powered HS code detection, 
            automated export documentation, and real-time ESG risk assessment.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/dashboard">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Watch Demo
            </Button>
          </div>

          <div className="flex justify-center items-center space-x-8 text-slate-500">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200">
              ⚡ Core Features
            </Badge>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Everything you need for global compliance
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Streamline your international operations with our comprehensive suite of compliance tools.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-slate-50">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-slate-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-12">Trusted by growing DTC brands worldwide</h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-100">Active Stores</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-blue-100">HS Code Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">80%</div>
              <div className="text-blue-100">Time Saved</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-blue-100">Countries Supported</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-700 border-green-200">
              💬 Customer Stories
            </Badge>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Loved by businesses like yours
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-700 mb-6 text-lg italic">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{testimonial.name}</div>
                      <div className="text-slate-600">{testimonial.company}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-6">
            Ready to automate your compliance?
          </h2>
          <p className="text-xl mb-8 text-slate-300">
            Join hundreds of DTC brands already saving time and reducing risk with ShopifyQ.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/dashboard">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 border-slate-300 text-slate-300 hover:bg-slate-800">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ShopifyQ
                </span>
              </div>
              <p className="text-slate-600">
                AI-powered compliance automation for modern DTC brands.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Product</h4>
              <div className="space-y-2">
                <Link to="/features" className="block text-slate-600 hover:text-blue-600">Features</Link>
                <Link to="/pricing" className="block text-slate-600 hover:text-blue-600">Pricing</Link>
                <Link to="/integrations" className="block text-slate-600 hover:text-blue-600">Integrations</Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Company</h4>
              <div className="space-y-2">
                <Link to="/about" className="block text-slate-600 hover:text-blue-600">About</Link>
                <Link to="/careers" className="block text-slate-600 hover:text-blue-600">Careers</Link>
                <Link to="/contact" className="block text-slate-600 hover:text-blue-600">Contact</Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Support</h4>
              <div className="space-y-2">
                <Link to="/help" className="block text-slate-600 hover:text-blue-600">Help Center</Link>
                <Link to="/docs" className="block text-slate-600 hover:text-blue-600">Documentation</Link>
                <Link to="/status" className="block text-slate-600 hover:text-blue-600">Status</Link>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-200 text-center text-slate-600">
            <p>&copy; 2024 ShopifyQ. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
