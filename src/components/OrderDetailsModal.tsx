/* ────────────────────────────────────────────────────────────
 *  OrderDetailsModal.tsx  –  always shows PDFs on scroll
 *  Hard‑coded document URLs:
 *    • /public/Invoice_1003.pdf
 *    • /public/PackingList_1003-6.pdf
 * ────────────────────────────────────────────────────────────*/

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import clsx from "clsx";

/* Props */
interface Props {
  order: { id: number | string } | null;
  onClose: () => void;
}

/* Supabase client */
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

/* helpers (same as before) */
async function getShopCredentials() {
  const email = localStorage.getItem("user_email");
  const type = localStorage.getItem("user_type");
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

  const res = await fetch(`${backend}/shopify/orders/details`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shop, accessToken: token, orderId })
  });
  if (!res.ok) throw new Error("Order details request failed");
  return res.json(); // { order , shop }
}

/* UI helpers */
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

/* ── Component ───────────────────────────────────────────── */
const OrderDetailsModal: React.FC<Props> = ({ order, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!order) return;
    (async () => {
      try {
        setLoading(true);
        const { order: full } = await fetchOrderDetails(order.id);
        setData(full);
      } catch (e: any) {
        setErr(e.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    })();
  }, [order]);

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div
        className={clsx(
          "bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-lg p-6"
        )}
      >
        {/* header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold">
              Order #{String(order.id).slice(-6)}
            </h2>
            {data?.created_at && (
              <p className="text-sm text-gray-500">
                Placed{" "}
                {new Date(data.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* body content */}
        {loading && <p className="text-sm">Loading details…</p>}
        {err && <p className="text-sm text-red-600">{err}</p>}

        {data && (
          <>
            <Section title="Customer">
              <Row
                label="Name"
                value={`${data.customer?.first_name || ""} ${
                  data.customer?.last_name || ""
                }`.trim()}
              />
              <Row label="Email" value={data.email || data.contact_email} />
              <Row
                label="Phone"
                value={data.customer?.phone || data.phone || "—"}
              />
            </Section>

            <Section title="Shipping Address">
              {(Object.values(data.shipping_address || {}) as string[])
                .filter(Boolean)
                .slice(0, 5)
                .map((l, i) => (
                  <p key={i} className="text-sm">
                    {l}
                  </p>
                ))}
            </Section>

            {data.billing_address && (
              <Section title="Billing Address">
                {(Object.values(data.billing_address) as string[])
                  .filter(Boolean)
                  .slice(0, 5)
                  .map((l, i) => (
                    <p key={i} className="text-sm">
                      {l}
                    </p>
                  ))}
              </Section>
            )}

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
                      <td className="border px-2 py-1">
                        {li.title || li.name}
                      </td>
                      <td className="border px-2 py-1 text-center">
                        {li.quantity}
                      </td>
                      <td className="border px-2 py-1 text-center">
                        ${parseFloat(li.price).toFixed(2)}
                      </td>
                      <td className="border px-2 py-1 text-center">
                        $
                        {(
                          parseFloat(li.price) * parseInt(li.quantity)
                        ).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            <Section title="Totals">
              <Row
                label="Subtotal"
                value={`$${parseFloat(data.subtotal_price).toFixed(2)}`}
              />
              <Row
                label="Tax"
                value={`$${parseFloat(data.total_tax).toFixed(2)}`}
              />
              <Row
                label="Shipping"
                value={`$${parseFloat(
                  data.total_shipping_price_set?.shop_money?.amount || 0
                ).toFixed(2)}`}
              />
              <Row
                label="Grand Total"
                value={`$${parseFloat(data.total_price).toFixed(2)}`}
              />
              <Row
                label="Financial Status"
                value={data.financial_status}
              />
              <Row
                label="Fulfillment Status"
                value={data.fulfillment_status || "unfulfilled"}
              />
            </Section>

            {/* --- embedded PDFs --- */}
            <Section title="Invoice PDF">
              <iframe
                src="/Invoice_1003.pdf"
                title="Invoice PDF"
                className="w-full h-[500px] border"
              />
            </Section>

            <Section title="Packing‑List PDF">
              <iframe
                src="/PackingList_1003-6.pdf"
                title="Packing List PDF"
                className="w-full h-[500px] border"
              />
            </Section>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderDetailsModal;
