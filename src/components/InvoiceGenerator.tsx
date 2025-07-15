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
  const pageWidth = doc.internal.pageSize.getWidth();

  // Base font style
  doc.setFontSize(9);
  doc.setTextColor(30);

  // Optional logo
  if (shopData.logo) {
    try {
      doc.addImage(shopData.logo, 'PNG', 20, 15, 30, 15);
    } catch {}
  }

  // Title: INVOICE
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('INVOICE', pageWidth - 20, 28, { align: 'right' });

  // Divider
  doc.setDrawColor(150);
  doc.line(20, 32, pageWidth - 20, 32);

  // ISSUED TO section
  const shipping = orderData.shipping_address || {};
  const customer = orderData.customer || {};
  let yLeft = 45;

  doc.setFontSize(9);
  doc.setFont(undefined, 'bold').text('ISSUED TO:', 20, yLeft);
  yLeft += 5;
  doc.setFont(undefined, 'normal');
  if (customer.first_name || customer.last_name) {
    doc.text(`${customer.first_name || ''} ${customer.last_name || ''}`.trim(), 20, yLeft);
    yLeft += 5;
  }
  if (shipping.address1) {
    doc.text(shipping.address1, 20, yLeft);
    yLeft += 5;
  }
  if (shipping.city || shipping.zip) {
    doc.text(`${shipping.city || ''}, ${shipping.province || ''} ${shipping.zip || ''}`, 20, yLeft);
  }

  // INVOICE DETAILS
  let yRight = 45;
  const rightX = pageWidth - 20;
  doc.setFont(undefined, 'bold').text('INVOICE NO:', rightX - 50, yRight);
  doc.setFont(undefined, 'normal').text(`${orderData.order_number || orderData.id}`, rightX, yRight, { align: 'right' });

  yRight += 5;
  doc.setFont(undefined, 'bold').text('DATE:', rightX - 50, yRight);
  doc.setFont(undefined, 'normal').text(new Date(orderData.created_at).toLocaleDateString(), rightX, yRight, { align: 'right' });

  // TABLE HEADERS
  const tableStartY = 90;
  doc.setDrawColor(0);
  doc.line(20, tableStartY - 4, pageWidth - 20, tableStartY - 4);

  doc.setFont(undefined, 'bold');
  doc.text('DESCRIPTION', 20, tableStartY);
  doc.text('UNIT PRICE', 105, tableStartY, { align: 'right' });
  doc.text('QTY', 130, tableStartY, { align: 'right' });
  doc.text('TOTAL', 180, tableStartY, { align: 'right' });

  doc.line(20, tableStartY + 2, pageWidth - 20, tableStartY + 2);

  // TABLE CONTENT
  let curY = tableStartY + 8;
  doc.setFont(undefined, 'normal');
  let subtotal = 0;

  (orderData.line_items || []).forEach((item: any) => {
    const desc = item.title || 'Product';
    const qty = parseFloat(item.quantity || '1');
    const price = parseFloat(item.price || '0');
    const total = qty * price;
    subtotal += total;

    doc.text(desc, 20, curY);
    doc.text(`$${price.toFixed(2)}`, 105, curY, { align: 'right' });
    doc.text(`${qty}`, 130, curY, { align: 'right' });
    doc.text(`$${total.toFixed(2)}`, 180, curY, { align: 'right' });

    curY += 8;
  });

  // TOTALS SECTION
  curY += 10;
  doc.setDrawColor(150);
  doc.line(130, curY - 4, pageWidth - 20, curY - 4);

  const tax = parseFloat(orderData.total_tax || '0');
  const total = parseFloat(orderData.total_price || subtotal + tax);

  doc.setFont(undefined, 'bold');
  doc.text('SUBTOTAL', 130, curY);
  doc.text(`$${subtotal.toFixed(2)}`, 180, curY, { align: 'right' });

  curY += 6;
  doc.setFont(undefined, 'normal');
  doc.text('Tax (10%)', 130, curY);
  doc.text(`$${tax.toFixed(2)}`, 180, curY, { align: 'right' });

  curY += 6;
  doc.setFont(undefined, 'bold');
  doc.text('TOTAL', 130, curY);
  doc.text(`$${total.toFixed(2)}`, 180, curY, { align: 'right' });

  // Signature / Shop name
  curY += 25;
  doc.setFontSize(11);
  doc.setFont(undefined, 'italic');
  doc.text(shopData.name || 'Your Store', pageWidth - 20, curY, { align: 'right' });

  // Instead of saving directly, get the PDF as buffer
  const pdfBuffer = doc.output('arraybuffer');
  
  // Generate filename
  const fileName = `Invoice_${orderData.order_number || orderData.id}_${Date.now()}.pdf`;
  
  // Return both the buffer and filename
  return { pdfBuffer, fileName, doc };
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
        
        // Generate PDF
        const { pdfBuffer, fileName, doc } = await generateInvoicePDF(data.order, data.shop);
        
        // Save locally for user
        doc.save(`Invoice_${data.order.order_number || data.order.id}.pdf`);
        
        // Upload to S3 and save to Supabase
        const uploadResponse = await fetch(`${backend}/shopify/invoices/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shop,
            accessToken: shopify_access_token,
            orderId: order.id,
            orderData: data.order,
            pdfBuffer: Array.from(new Uint8Array(pdfBuffer)),
            fileName
          }),
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          console.log('Invoice saved:', uploadData.invoiceUrl);
          onGenerated(order.id);
          onClose();
        } else {
          const errorData = await uploadResponse.json();
          console.error('Failed to save invoice:', errorData);
          // Still consider it successful since the user has the PDF
          onGenerated(order.id);
          onClose();
        }
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
