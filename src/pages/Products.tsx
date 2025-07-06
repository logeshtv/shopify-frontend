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
  Image as ImageIcon,
  X,
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
import { LoadingSpinner } from "./LoadingSpinner";

const API = {
  PRODUCTS_ALL: "/shopify/getAllProducts",
  PRODUCT_ID: "/shopify/getProductID",
  PRODUCT_CREATE: "/shopify/createProduct",
  PRODUCT_UPDATE: "/shopify/updateProductID",
  PRODUCT_DELETE: "/shopify/deleteProduct",
  IMAGE_CREATE: "/shopify/image/create",
  IMAGE_DELETE: "/shopify/image/delete",
};


const Products = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const backend = import.meta.env.VITE_BACKEND_ENDPOINT;

  /* fetch products once */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { shop, accessToken } = await resolveShopAndToken();
        const res = await fetch(`${backend}${API.PRODUCTS_ALL}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shop, accessToken }),
        });
        const payload = await res.json();
        setProducts(payload.products || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* delete product */
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const { shop, accessToken } = await resolveShopAndToken();
      const r = await fetch(`${backend}${API.PRODUCT_DELETE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop, accessToken, productId }),
      });
      if (!r.ok) throw new Error(await r.text());
      alert("Product deleted successfully!");
      window.location.reload();
    } catch (e) {
      alert(e.message);
    }
  };

  /* simple filter */
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
  const needReview = total - hsCoded;



  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNavigation />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Header
          loading={loading}
          onAdd={() => setAddProductOpen(true)}
          onSync={() => window.location.reload()}
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard title="Total Products" value={total} icon={Package} />
          <StatsCard title="HS Coded" value={hsCoded} icon={CheckCircle} />
          <StatsCard title="Need Review" value={needReview} icon={AlertTriangle} />
          <StatsCard title="High ESG Risk" value={0} icon={AlertTriangle} />
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

        {/* ───────────────── PRODUCT LIST ───────────────── */}
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


const Header = ({ loading, onAdd, onSync }) => (
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
      <Button variant="outline" onClick={onSync} disabled={loading}>
        <RefreshCw className="h-4 w-4 mr-2" />
        {loading ? "Syncing…" : "Sync from Shopify"}
      </Button>
      <Button
        className="bg-gradient-to-r from-blue-600 to-purple-600"
        onClick={onAdd}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Product
      </Button>
    </div>
  </div>
);

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
        <Button variant="ghost" size="sm">
          <BarChart3 className="h-4 w-4" />
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
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const backend = import.meta.env.VITE_BACKEND_ENDPOINT;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { shop, accessToken } = await resolveShopAndToken();
        const res = await fetch(`${backend}${API.PRODUCT_ID}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shop, accessToken, productId }),
        });
        if (res.ok) {
          const data = await res.json();
          setProduct(data.product);
          setImages(data.product.images || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
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
  <div className="py-8">
    <LoadingSpinner size="lg" />
  </div>
        ) : !product ? (
          <p>Product not found</p>
        ) : (
          <div className="space-y-4">
            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {images.slice(0, 4).map((img) => (
                  <div key={img.id} className="h-24 bg-slate-100 rounded-lg overflow-hidden">
                    <img src={img.src} alt={img.alt || product.title} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
            
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
  const [uploading, setUploading] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "",
    body_html: "",
    vendor: "",
    product_type: "",
    price: "",
    sku: "",
    inventory_quantity: 0
  });
  const backend = import.meta.env.VITE_BACKEND_ENDPOINT;

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const { shop, accessToken } = await resolveShopAndToken();
      const response = await fetch(`${backend}${API.PRODUCT_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop, accessToken, productId }),
      });

      if (response.ok) {
        const data = await response.json();
        const product = data.product;
        setProduct(product);
        setImages(product.images || []);
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    
    setUploading(true);
    try {
      const { attachment, filename } = await fileToAttachment(file);
      const { shop, accessToken } = await resolveShopAndToken();
      const resp = await fetch(`${backend}${API.IMAGE_CREATE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop,
          accessToken,
          productId,
          imageData: { attachment, filename, alt: filename },
        }),
      });
      if (!resp.ok) throw new Error('Upload failed');
      const { image } = await resp.json();
      setImages((prev) => [...prev, image]);
    } catch (e) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!confirm("Delete this image?")) return;
    try {
      const { shop, accessToken } = await resolveShopAndToken();
      const res = await fetch(`${backend}${API.IMAGE_DELETE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop, accessToken, productId, imageId }),
      });
      if (res.ok) {
        setImages(images.filter(img => img.id !== imageId));
        alert("Image deleted successfully!");
      }
    } catch (e) {
      alert("Failed to delete image");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { shop, accessToken } = await resolveShopAndToken();

      const updateResp = await fetch(`${backend}${API.PRODUCT_UPDATE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop, accessToken, productId, productData: form }),
      });
      if (!updateResp.ok) throw new Error("Failed to update product");

      alert("Product updated successfully!");
      onSave?.();
      onClose();
    } catch (e) {
      alert(e.message);
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
           <div className="py-8">
           <LoadingSpinner size="lg" />
         </div>
        ) : (
          <div className="space-y-4">
            {images.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Current Images</p>
                <div className="grid grid-cols-3 gap-2">
                  {images.map((img) => (
                    <div key={img.id} className="relative h-20 bg-slate-100 rounded-lg overflow-hidden">
                      <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleDeleteImage(img.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Input
              placeholder="Product Title"
              value={form.title}
              onChange={(e) => setForm({...form, title: e.target.value})}
            />
            <Input
              placeholder="Vendor"
              value={form.vendor}
              onChange={(e) => setForm({...form, vendor: e.target.value})}
            />
            <Input
              placeholder="Product Type"
              value={form.product_type}
              onChange={(e) => setForm({...form, product_type: e.target.value})}
            />
            <Input
              placeholder="Price"
              value={form.price}
              onChange={(e) => setForm({...form, price: e.target.value})}
            />
            <Input
              placeholder="SKU"
              value={form.sku}
              onChange={(e) => setForm({...form, sku: e.target.value})}
            />
            <Input
              placeholder="Inventory Quantity"
              type="number"
              value={form.inventory_quantity}
              onChange={(e) => setForm({...form, inventory_quantity: parseInt(e.target.value) || 0})}
            />
            <Textarea
              placeholder="Description (HTML)"
              value={form.body_html}
              onChange={(e) => setForm({...form, body_html: e.target.value})}
            />
            
            <label className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
              <ImageIcon className="h-4 w-4" />
              <span>{uploading ? "Uploading..." : "Add New Image"}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

const ProductAddModal = ({ onClose, onSave }) => {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body_html: "",
    vendor: "",
    product_type: "",
    price: "",
    sku: "",
    inventory_quantity: 0
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const backend = import.meta.env.VITE_BACKEND_ENDPOINT;

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);
    setImageFiles(files);
    
    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    // Revoke the URL to free memory
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const handleAdd = async () => {
    setSaving(true);
    try {
      const { shop, accessToken } = await resolveShopAndToken();

      const resp = await fetch(`${backend}${API.PRODUCT_CREATE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop, accessToken, productData: form }),
      });
      if (!resp.ok) throw new Error("Product create failed");
      const { product } = await resp.json();

      // Upload images after product creation
      if (imageFiles.length > 0) {
        setUploading(true);
        for (const file of imageFiles) {
          const { attachment, filename } = await fileToAttachment(file);
          await fetch(`${backend}${API.IMAGE_CREATE}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              shop,
              accessToken,
              productId: product.id,
              imageData: { attachment, filename, alt: filename },
            }),
          });
        }
        setUploading(false);
      }

      alert("Product created successfully!");
      onSave?.();
      onClose();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
      setUploading(false);
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
          <Button onClick={handleAdd} disabled={saving || uploading}>
            <Plus className="h-4 w-4 mr-2" />
            {saving ? (uploading ? "Uploading images..." : "Creating...") : "Create Product"}
          </Button>
        </div>

        <div className="space-y-4">
          {imagePreviews.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Selected Images</p>
              <div className="grid grid-cols-3 gap-2">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative h-20 bg-slate-100 rounded-lg overflow-hidden">
                    <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Input
            placeholder="Product Title"
            value={form.title}
            onChange={(e) => setForm({...form, title: e.target.value})}
          />
          <Input
            placeholder="Vendor"
            value={form.vendor}
            onChange={(e) => setForm({...form, vendor: e.target.value})}
          />
          <Input
            placeholder="Product Type"
            value={form.product_type}
            onChange={(e) => setForm({...form, product_type: e.target.value})}
          />
          <Input
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({...form, price: e.target.value})}
          />
          <Input
            placeholder="SKU"
            value={form.sku}
            onChange={(e) => setForm({...form, sku: e.target.value})}
          />
          <Input
            placeholder="Inventory Quantity"
            type="number"
            value={form.inventory_quantity}
            onChange={(e) => setForm({...form, inventory_quantity: parseInt(e.target.value) || 0})}
          />
          <Textarea
            placeholder="Description (HTML)"
            value={form.body_html}
            onChange={(e) => setForm({...form, body_html: e.target.value})}
          />
          
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <ImageIcon className="h-4 w-4" />
            <span>Product Images</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleUpload}
            />
          </label>
        </div>
      </div>
    </div>
  );
};


async function resolveShopAndToken() {
  const email = localStorage.getItem("user_email");
  const userType = localStorage.getItem("user_type");
  let shop, accessToken;

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
  return { shop, accessToken };
}

function fileToAttachment(file: File): Promise<{ attachment: string; filename: string }> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      res({ attachment: base64, filename: file.name });
    };
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

export default Products;
