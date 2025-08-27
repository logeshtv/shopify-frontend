import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import clsx from "clsx";

/* ────────────────────────────────────────────────────────────
 *  Types & Supabase
 * ────────────────────────────────────────────────────────────*/
interface Props {
  order: { id: number | string } | null;
  onClose: () => void;
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

/* ────────────────────────────────────────────────────────────
 *  Helpers
 * ────────────────────────────────────────────────────────────*/
async function getShopCredentials() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const email = user.email;
  const type = user.type;
  
  if (!email) throw new Error("Missing user email");

  if (type === "sub_user") {
    const { data: sub } = await supabase
      .from("sub_users")
      .select("owner_id")
      .eq("email", email)
      .single();
    const { data: shop } = await supabase
      .from("shops")
      .select("shopify_domain, shopify_access_token")
      .eq("user_id", sub.owner_id)
      .single();
    return { shop: shop.shopify_domain, token: shop.shopify_access_token };
  }

  const { data: usr } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();
  const { data: shop } = await supabase
    .from("shops")
    .select("shopify_domain, shopify_access_token")
    .eq("user_id", usr.id)
    .single();
  return { shop: shop.shopify_domain, token: shop.shopify_access_token };
}


async function fetchOrderDetails(orderId: number | string) {
  const backend = import.meta.env.VITE_BACKEND_ENDPOINT;
  const { shop, token } = await getShopCredentials();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const res = await fetch(`${backend}/shopify/orders/details`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shop, accessToken: token, orderId }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Order details request failed: ${res.status} ${errorText}`);
    }
    
    return res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  }
}


/* ────────────────────────────────────────────────────────────
 *  Tiny UI helpers
 * ────────────────────────────────────────────────────────────*/
const Section = ({ title, children }: any) => (
  <div className="mb-6">
    <h3 className="text-md font-semibold mb-2">{title}</h3>
    {children}
  </div>
);
const Row = ({ label, value }: any) => (
  <div className="flex justify-between text-sm py-0.5">
    <span className="text-gray-600">{label}</span>
    <span className="font-medium text-gray-900">{value}</span>
  </div>
);

/* ────────────────────────────────────────────────────────────
 *  The Modal
 * ────────────────────────────────────────────────────────────*/
const OrderDetailsModal: React.FC<Props> = ({ order, onClose }) => {
  const [data, setData]                 = useState<any>(null);
  const [loading, setLoading]           = useState(false);
  const [err, setErr]                   = useState("");
  const [invoiceUrl, setInvoiceUrl]     = useState<string | null>(null);
  const [packingUrl, setPackingUrl]     = useState<string | null>(null);

  const backend = import.meta.env.VITE_BACKEND_ENDPOINT;

  /* -------- fetch on order change -------- */
  useEffect(() => {
    if (!order) return;

    // reset state – fixes “wrong order” PDFs
    setData(null);
    setErr("");
    setInvoiceUrl(null);
    setPackingUrl(null);

    const fetchData = async () => {
      try {
        setLoading(true);

        /* 1. Shopify order details */
        const { order: full } = await fetchOrderDetails(order.id);
        setData(full);

        /* 2. PDF URLs in Supabase */
        const [invoiceRes, packingRes] = await Promise.all([
          supabase
            .from("order_invoices")
            .select("invoice_url")
            .eq("order_id", String(order.id))
            .maybeSingle(),

          supabase
            .from("order_packing_lists")
            .select("packing_list_url")
            .eq("order_id", String(order.id))
            .maybeSingle()
        ]);

        if (invoiceRes.data?.invoice_url) setInvoiceUrl(invoiceRes.data.invoice_url);
        if (packingRes.data?.packing_list_url) setPackingUrl(packingRes.data.packing_list_url);
      } catch (e: any) {
        setErr(e.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [order]);

  /* -------- proxy URLs through the backend document controller -------- */
  const proxyInvoice = invoiceUrl
    ? `${backend}/shopify/documents/view?documentUrl=${encodeURIComponent(invoiceUrl)}`
    : null;

  const proxyPacking = packingUrl
    ? `${backend}/shopify/documents/view?documentUrl=${encodeURIComponent(packingUrl)}`
    : null;

  /* -------- render -------- */
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className={clsx(
        "bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto",
        "rounded-lg shadow-lg p-6"
      )}>
        {/* header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold">
              Order #{String(order.id).slice(-6)}
            </h2>
            {data?.created_at && (
              <p className="text-sm text-gray-500">
                Placed {new Date(data.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* status */}
        {loading && <p className="text-sm">Loading details…</p>}
        {err     && <p className="text-sm text-red-600">{err}</p>}

        {/* body */}
        {data && (
          <>
            {/* ---- Customer ---- */}
            <Section title="Customer">
              <Row
                label="Name"
                value={`${data.customer?.first_name || ""} ${data.customer?.last_name || ""}`.trim()}
              />
              <Row label="Email" value={data.email || data.contact_email} />
              <Row label="Phone" value={data.customer?.phone || data.phone || "—"} />
            </Section>

            {/* ---- Shipping ---- */}
            <Section title="Shipping Address">
              {(Object.values(data.shipping_address || {}) as string[])
                .filter(Boolean)
                .slice(0, 5)
                .map((l, i) => <p key={i} className="text-sm">{l}</p>)}
            </Section>

            {/* ---- Billing ---- */}
            {data.billing_address && (
              <Section title="Billing Address">
                {(Object.values(data.billing_address) as string[])
                  .filter(Boolean)
                  .slice(0, 5)
                  .map((l, i) => <p key={i} className="text-sm">{l}</p>)}
              </Section>
            )}

            {/* ---- Items ---- */}
            <Section title={`Items (${data.line_items.length})`}>
              <table className="w-full text-sm border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border px-2 py-1 text-left">Product</th>
                    <th className="border px-2 py-1">Qty</th>
                    <th className="border px-2 py-1">Price</th>
                    <th className="border px-2 py-1">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.line_items.map((li: any) => (
                    <tr key={li.id}>
                      <td className="border px-2 py-1">{li.title || li.name}</td>
                      <td className="border px-2 py-1 text-center">{li.quantity}</td>
                      <td className="border px-2 py-1 text-center">
                        ${parseFloat(li.price).toFixed(2)}
                      </td>
                      <td className="border px-2 py-1 text-center">
                        ${(parseFloat(li.price) * parseInt(li.quantity)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            {/* ---- Totals ---- */}
            <Section title="Totals">
              <Row label="Subtotal"           value={`$${parseFloat(data.subtotal_price).toFixed(2)}`} />
              <Row label="Tax"                value={`$${parseFloat(data.total_tax).toFixed(2)}`} />
              <Row label="Shipping"           value={`$${parseFloat(data.total_shipping_price_set?.shop_money?.amount || 0).toFixed(2)}`} />
              <Row label="Grand Total"        value={`$${parseFloat(data.total_price).toFixed(2)}`} />
              <Row label="Financial Status"   value={data.financial_status} />
              <Row label="Fulfillment Status" value={data.fulfillment_status || "unfulfilled"} />
            </Section>

            {/* ---- Invoice PDF ---- */}
            <Section title="Invoice PDF">
              {proxyInvoice ? (
                <iframe
                  src={proxyInvoice}
                  title="Invoice PDF"
                  className="w-full h-[500px] border"
                />
              ) : (
                <div className="p-4 bg-gray-50 border rounded text-center">
                  <p className="text-gray-600">Invoice has not been generated yet.</p>
                </div>
              )}
            </Section>

            {/* ---- Packing‑List PDF ---- */}
            <Section title="Packing List PDF">
              {proxyPacking ? (
                <iframe
                  src={proxyPacking}
                  title="Packing List PDF"
                  className="w-full h-[500px] border"
                />
              ) : (
                <div className="p-4 bg-gray-50 border rounded text-center">
                  <p className="text-gray-600">Packing list has not been generated yet.</p>
                </div>
              )}
            </Section>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderDetailsModal;
