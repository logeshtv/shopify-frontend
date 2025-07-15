import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import jsPDF from 'jspdf';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface Order {
  id: string;
  customer: string;
  date: string;
  total: string;
}

interface InvoiceGeneratorProps {
  order: Order | null;
  onClose: () => void;
  onGenerated: (orderId: string) => void;
}

const generateInvoicePDF = async (orderData: any, shopData: any) => {
  const doc = new jsPDF();
  
  // Header with logo (if available)
  if (shopData.logo) {
    try {
      doc.addImage(shopData.logo, 'PNG', 20, 20, 40, 20);
    } catch (e) {
      console.log('Could not add logo');
    }
  }
  
  // Company info
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text(shopData.name || 'Your Store', 20, 50);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  if (shopData.address1) {
    doc.text(`${shopData.address1}`, 20, 60);
    if (shopData.city && shopData.province) {
      doc.text(`${shopData.city}, ${shopData.province} ${shopData.zip || ''}`, 20, 70);
    }
  }
  
  // Invoice title
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('INVOICE', 150, 30);
  
  // Invoice details
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Invoice #: ${orderData.order_number || orderData.id}`, 150, 45);
  doc.text(`Date: ${new Date(orderData.created_at).toLocaleDateString()}`, 150, 55);
  
// Bill to
doc.setFont(undefined, 'bold');
doc.text('SHIP TO:', 20, 90);
doc.setFont(undefined, 'normal');

const customer = orderData.customer;
const shipping = orderData.shipping_address;

if (customer) {
  doc.text(`${customer.first_name || ''} ${customer.last_name || ''}`.trim(), 20, 100);
}
if (shipping) {
  let yPos = 110;
  if (shipping.address1) {
    doc.text(shipping.address1, 20, yPos);
    yPos += 10;
  }
  if (shipping.city && shipping.province) {
    doc.text(`${shipping.city}, ${shipping.province} ${shipping.zip || ''}`, 20, yPos);
    yPos += 10;
  }
  if (shipping.country) {
    doc.text(shipping.country, 20, yPos);
  }
}

  
  // Table header
  const startY = 140;
  doc.setFont(undefined, 'bold');
  doc.text('Item', 20, startY);
  doc.text('Qty', 100, startY);
  doc.text('Price', 130, startY);
  doc.text('Total', 160, startY);
  
  // Table line
  doc.line(20, startY + 5, 190, startY + 5);
  
  // Table content
  let currentY = startY + 15;
  doc.setFont(undefined, 'normal');
  
  if (orderData.line_items && orderData.line_items.length > 0) {
    orderData.line_items.forEach((item: any) => {
      const itemName = item.title || item.name || 'Product';
      const quantity = parseInt(item.quantity || '1');
      const price = parseFloat(item.price || '0');
      const total = (price * quantity).toFixed(2);
      
      doc.text(itemName.length > 25 ? itemName.substring(0, 25) + '...' : itemName, 20, currentY);
      doc.text(quantity.toString(), 100, currentY);
      doc.text(`$${price.toFixed(2)}`, 130, currentY);
      doc.text(`$${total}`, 160, currentY);
      currentY += 10;
    });
  } else {
    doc.text('No items found', 20, currentY);
    currentY += 10;
  }
  
  // Totals
  currentY += 10;
  doc.line(130, currentY, 190, currentY);
  currentY += 10;
  
  doc.text('Subtotal:', 130, currentY);
  doc.text(`$${parseFloat(orderData.subtotal_price || '0').toFixed(2)}`, 160, currentY);
  currentY += 10;
  
  doc.text('Tax:', 130, currentY);
  doc.text(`$${parseFloat(orderData.total_tax || '0').toFixed(2)}`, 160, currentY);
  currentY += 10;
  
  doc.setFont(undefined, 'bold');
  doc.text('Total:', 130, currentY);
  doc.text(`$${parseFloat(orderData.total_price || '0').toFixed(2)}`, 160, currentY);
  
  // Download
  doc.save(`Invoice_${orderData.order_number || orderData.id}.pdf`);
};

const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({ order, onClose, onGenerated }) => {
  if (!order) return null;

  const handleGenerate = async () => {
    try {
      const backend = import.meta.env.VITE_BACKEND_ENDPOINT;
      const email = localStorage.getItem("user_email");
      const userType = localStorage.getItem("user_type");
      
      // Get shop credentials from Supabase
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

      // Fetch detailed order data from Shopify
      const response = await fetch(`${backend}/shopify/orders/details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          shop, 
          accessToken: shopify_access_token, 
          orderId: order.id 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Order data:', data.order);
        console.log('Shop data:', data.shop);
        await generateInvoicePDF(data.order, data.shop);
        onGenerated(order.id);
        onClose();
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch order details:', errorData);
        alert('Failed to generate invoice. Please try again.');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Error generating invoice. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Generate Invoice</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Order ID</label>
            <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
              {order.id}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700">Customer</label>
            <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
              {order.customer}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700">Total</label>
            <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
              {order.total}
            </div>
          </div>
          
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={handleGenerate}
          >
            <Download className="h-4 w-4 mr-2" />
            Generate & Download Invoice
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;
