
import { useState, useEffect, useMemo } from "react";
import {
  Package,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  BarChart3,
  Save,
  Trash2,
} from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { DashboardNavigation } from "@/components/DashboardNavigation";
import { supabase } from "@/lib/supabaseClient";

const Products = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const backend = import.meta.env.VITE_BACKEND_ENDPOINT;

  useEffect(() => {
    const fetchShopifyProducts = async () => {
      try {
        setLoading(true);
        const email = localStorage.getItem("user_email");
        const userType = localStorage.getItem("user_type");

        if (!email) throw new Error("User not logged in");

        let shop = null;
        let accessToken = null;

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
          shop = shopRow?.shopify_domain;
          accessToken = shopRow?.shopify_access_token;
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
          shop = shopRow?.shopify_domain;
          accessToken = shopRow?.shopify_access_token;
        }

        const res = await fetch(`${backend}/shopify/getAllProducts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shop, accessToken }),
        });

        const payload = await res.json();
        setProducts(payload.products || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchShopifyProducts();
  }, []);

  const handleDeleteProduct = async (productId) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    try {
      const email = localStorage.getItem("user_email");
      const userType = localStorage.getItem("user_type");
      let shop = null;
      let shopify_access_token = null;

      if (userType === "sub_user") {
        const { data: subUser } = await supabase
          .from("sub_users")
          .select("owner_id")
          .eq("email", email)
          .single();
        const { data: shopRow } = await supabase
          .from("shops")
          .select("shopify_domain, shopify_access_token")
          .eq("user_id", subUser?.owner_id)
          .single();
        shop = shopRow?.shopify_domain;
        shopify_access_token = shopRow?.shopify_access_token;
      } else {
        const { data: user } = await supabase
          .from("users")
          .select("id")
          .eq("email", email)
          .single();
        const { data: shopRow } = await supabase
          .from("shops")
          .select("shopify_domain, shopify_access_token")
          .eq("user_id", user?.id)
          .single();
        shop = shopRow?.shopify_domain;
        shopify_access_token = shopRow?.shopify_access_token;
      }

      const response = await fetch(`${backend}/shopify/deleteProduct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          shop, 
          accessToken: shopify_access_token, 
          productId
        }),
      });

      if (response.ok) {
        alert("Product deleted successfully!");
        window.location.reload();
      } else {
        alert("Failed to delete product");
      }
    } catch (error) {
      alert("Error deleting product: " + error.message);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter(
      (p) =>
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.variants?.some((v) =>
          v.sku?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );
  }, [products, searchTerm]);

  const total = products.length;
  const hsCoded = products.filter((p) => p?.hs_code).length;
  const needReview = products.filter((p) => !p?.hs_code).length;
  const highRisk = 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNavigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Product Management
            </h1>
            <p className="text-slate-600">
              Manage your Shopify products and compliance status
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => window.location.reload()} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {loading ? "Syncing…" : "Sync from Shopify"}
            </Button>
            <Button 
              className="bg-gradient-to-r from-blue-600 to-purple-600"
              onClick={() => setAddProductOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard title="Total Products" value={total} icon={Package} />
          <StatsCard title="HS Coded" value={hsCoded} icon={CheckCircle} />
          <StatsCard title="Need Review" value={needReview} icon={AlertTriangle} />
          <StatsCard title="High ESG Risk" value={highRisk} icon={AlertTriangle} />
        </div>

        <Card className="border-0 shadow-lg mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search products by name or SKU…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2 text-blue-600" />
              Products ({filteredProducts.length})
            </CardTitle>
            <CardDescription>
              {loading
                ? "Fetching products from Shopify…"
                : "Manage your product catalog and compliance data"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-red-600 p-4">{error}</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-slate-500 p-4">
                {loading ? "Loading…" : "No products found."}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProducts.map((p) => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    onView={() => setSelectedProductId(p.id)}
                    onEdit={() => setEditProductId(p.id)}
                    onDelete={() => handleDeleteProduct(p.id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedProductId && (
        <ProductViewModal
          productId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
        />
      )}

      {editProductId && (
        <ProductEditModal
          productId={editProductId}
          onClose={() => setEditProductId(null)}
          onSave={() => window.location.reload()}
        />
      )}

      {addProductOpen && (
        <ProductAddModal
          onClose={() => setAddProductOpen(false)}
          onSave={() => window.location.reload()}
        />
      )}
    </div>
  );
};

const StatsCard = ({ title, value, icon: Icon }) => (
  <Card className="border-0 shadow-lg">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <Icon className="h-8 w-8 text-blue-600" />
      </div>
    </CardContent>
  </Card>
);

const ProductRow = ({ product, onView, onEdit, onDelete }) => {
  const status = product.complianceStatus || "pending";
  const sku = product.variants?.[0]?.sku ?? "—";
  const price = product.variants?.[0]?.price ? `$${product.variants[0].price}` : "—";
  const category = product.product_type || "—";

  return (
    <div className="flex items-center space-x-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
      <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
        {product?.image?.src ? (
          <img src={product.image.src} alt={product.title} className="object-cover w-full h-full" />
        ) : (
          <Package className="h-8 w-8 text-slate-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <h3 className="font-medium text-slate-900 truncate">{product.title}</h3>
          <Badge className={
            status === "compliant"
              ? "bg-green-100 text-green-800 border-green-200"
              : status === "review"
              ? "bg-yellow-100 text-yellow-800 border-yellow-200"
              : "bg-orange-100 text-orange-800 border-orange-200"
          }>
            {status}
          </Badge>
        </div>
        <div className="flex items-center space-x-4 text-sm text-slate-600">
          <span>SKU: {sku}</span>
          <span>•</span>
          <span>{category}</span>
          <span>•</span>
          <span>{price}</span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" onClick={onView}>
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const ProductViewModal = ({ productId, onClose }) => {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const backend = import.meta.env.VITE_BACKEND_ENDPOINT;

  useEffect(() => {
    const fetchProduct = async () => {
      const email = localStorage.getItem("user_email");
      const userType = localStorage.getItem("user_type");
      let shop = null;
      let accessToken = null;

      if (userType === "sub_user") {
        const { data: subUser } = await supabase
          .from("sub_users")
          .select("owner_id")
          .eq("email", email)
          .single();
        const { data: shopRow } = await supabase
          .from("shops")
          .select("shopify_domain, shopify_access_token")
          .eq("user_id", subUser?.owner_id)
          .single();
        shop = shopRow?.shopify_domain;
        accessToken = shopRow?.shopify_access_token;
      } else {
        const { data: user } = await supabase
          .from("users")
          .select("id")
          .eq("email", email)
          .single();
        const { data: shopRow } = await supabase
          .from("shops")
          .select("shopify_domain, shopify_access_token")
          .eq("user_id", user?.id)
          .single();
        shop = shopRow?.shopify_domain;
        accessToken = shopRow?.shopify_access_token;
      }

      const res = await fetch(`${backend}/shopify/getProductID`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop, accessToken, productId }),
      });

      if (res.ok) {
        const data = await res.json();
        setProduct(data.product);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [productId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
      <div className="bg-white max-w-xl w-full rounded-lg shadow-lg p-6 relative">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-black"
          onClick={onClose}
        >
          ✕
        </button>
        {loading ? (
          <p>Loading...</p>
        ) : !product ? (
          <p>Product not found</p>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">{product.title}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm text-slate-700">
              <div><strong>ID:</strong> {product.id}</div>
              <div><strong>Vendor:</strong> {product.vendor}</div>
              <div><strong>Type:</strong> {product.product_type}</div>
              <div><strong>Status:</strong> <Badge>{product.status}</Badge></div>
              <div><strong>Price:</strong> ${product.variants?.[0]?.price}</div>
              <div><strong>SKU:</strong> {product.variants?.[0]?.sku}</div>
            </div>
            {product.body_html && (
              <div>
                <strong>Description:</strong>
                <div dangerouslySetInnerHTML={{ __html: product.body_html }} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ProductEditModal = ({ productId, onClose, onSave }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body_html: "",
    vendor: "",
    product_type: "",
    price: "",
    sku: "",
    inventory_quantity: 0
  });

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    const email = localStorage.getItem("user_email");
    const userType = localStorage.getItem("user_type");
    let shop = null;
    let shopify_access_token = null;

    if (userType === "sub_user") {
      const { data: subUser } = await supabase
        .from("sub_users")
        .select("owner_id")
        .eq("email", email)
        .single();
      const { data: shopRow } = await supabase
        .from("shops")
        .select("shopify_domain, shopify_access_token")
        .eq("user_id", subUser?.owner_id)
        .single();
      shop = shopRow?.shopify_domain;
      shopify_access_token = shopRow?.shopify_access_token;
    } else {
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();
      const { data: shopRow } = await supabase
        .from("shops")
        .select("shopify_domain, shopify_access_token")
        .eq("user_id", user?.id)
        .single();
      shop = shopRow?.shopify_domain;
      shopify_access_token = shopRow?.shopify_access_token;
    }

    const response = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/shopify/getProductID`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shop, accessToken: shopify_access_token, productId }),
    });

    if (response.ok) {
      const data = await response.json();
      const product = data.product;
      setForm({
        title: product.title,
        body_html: product.body_html || "",
        vendor: product.vendor,
        product_type: product.product_type,
        price: product.variants?.[0]?.price || "",
        sku: product.variants?.[0]?.sku || "",
        inventory_quantity: product.variants?.[0]?.inventory_quantity || 0
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const email = localStorage.getItem("user_email");
      const userType = localStorage.getItem("user_type");
      let shop = null;
      let shopify_access_token = null;

      if (userType === "sub_user") {
        const { data: subUser } = await supabase
          .from("sub_users")
          .select("owner_id")
          .eq("email", email)
          .single();
        const { data: shopRow } = await supabase
          .from("shops")
          .select("shopify_domain, shopify_access_token")
          .eq("user_id", subUser?.owner_id)
          .single();
        shop = shopRow?.shopify_domain;
        shopify_access_token = shopRow?.shopify_access_token;
      } else {
        const { data: user } = await supabase
          .from("users")
          .select("id")
          .eq("email", email)
          .single();
        const { data: shopRow } = await supabase
          .from("shops")
          .select("shopify_domain, shopify_access_token")
          .eq("user_id", user?.id)
          .single();
        shop = shopRow?.shopify_domain;
        shopify_access_token = shopRow?.shopify_access_token;
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/shopify/updateProductID`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          shop, 
          accessToken: shopify_access_token, 
          productId,
          productData: form
        }),
      });

      if (response.ok) {
        alert("Product updated successfully!");
        onSave?.();
        onClose();
      } else {
        alert(`Failed to update product. Status: ${response.status}`);
      }
    } catch (error) {
      alert("Error updating product: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
      <div className="bg-white max-w-2xl w-full rounded-lg shadow-lg p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-black"
          onClick={onClose}
        >
          ✕
        </button>
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Edit Product</h2>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-4">
          <Input
            placeholder="Product Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Input
            placeholder="Vendor"
            value={form.vendor}
            onChange={(e) => setForm({ ...form, vendor: e.target.value })}
          />
          <Input
            placeholder="Product Type"
            value={form.product_type}
            onChange={(e) => setForm({ ...form, product_type: e.target.value })}
          />
          <Input
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <Input
            placeholder="SKU"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Inventory Quantity
            </label>
            <Input
              type="number"
              value={form.inventory_quantity}
              onChange={(e) =>
                setForm({
                  ...form,
                  inventory_quantity: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>
          <Textarea
            placeholder="Description (HTML)"
            rows={5}
            value={form.body_html}
            onChange={(e) => setForm({ ...form, body_html: e.target.value })}
          />
        </div>
      )}
    </div>
    </div>
  );
};

const ProductAddModal = ({ onClose, onSave }) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body_html: "",
    vendor: "",
    product_type: "",
    price: "",
    sku: "",
    inventory_quantity: 0
  });

  const handleAdd = async () => {
    setSaving(true);
    try {
      const email = localStorage.getItem("user_email");
      const userType = localStorage.getItem("user_type");
      let shop = null;
      let shopify_access_token = null;

      if (userType === "sub_user") {
        const { data: subUser } = await supabase
          .from("sub_users")
          .select("owner_id")
          .eq("email", email)
          .single();
        const { data: shopRow } = await supabase
          .from("shops")
          .select("shopify_domain, shopify_access_token")
          .eq("user_id", subUser?.owner_id)
          .single();
        shop = shopRow?.shopify_domain;
        shopify_access_token = shopRow?.shopify_access_token;
      } else {
        const { data: user } = await supabase
          .from("users")
          .select("id")
          .eq("email", email)
          .single();
        const { data: shopRow } = await supabase
          .from("shops")
          .select("shopify_domain, shopify_access_token")
          .eq("user_id", user?.id)
          .single();
        shop = shopRow?.shopify_domain;
        shopify_access_token = shopRow?.shopify_access_token;
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/shopify/createProduct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          shop, 
          accessToken: shopify_access_token, 
          productData: form
        }),
      });

      if (response.ok) {
        alert("Product created successfully!");
        onSave?.();
        onClose();
      } else {
        alert(`Failed to create product. Status: ${response.status}`);
      }
    } catch (error) {
      alert("Error creating product: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
      <div className="bg-white max-w-2xl w-full rounded-lg shadow-lg p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-black"
          onClick={onClose}
        >
          ✕
        </button>
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Add New Product</h2>
          <Button onClick={handleAdd} disabled={saving}>
            <Plus className="h-4 w-4 mr-2" />
            {saving ? "Creating..." : "Create Product"}
          </Button>
        </div>

        <div className="space-y-4">
            <Input
              placeholder="Product Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Input
              placeholder="Vendor"
              value={form.vendor}
              onChange={(e) => setForm({ ...form, vendor: e.target.value })}
            />
            <Input
              placeholder="Product Type"
              value={form.product_type}
              onChange={(e) => setForm({ ...form, product_type: e.target.value })}
            />
            <Input
              placeholder="Price"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
            <Input
              placeholder="SKU"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Inventory Quantity
              </label>
              <Input
                type="number"
                value={form.inventory_quantity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    inventory_quantity: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <Textarea
              placeholder="Description (HTML)"
              rows={5}
              value={form.body_html}
              onChange={(e) => setForm({ ...form, body_html: e.target.value })}
            />
          </div>
      </div>

    </div>
  );
};

export default Products;

