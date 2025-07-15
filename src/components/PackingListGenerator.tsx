// PackingListGenerator.tsx – Finalized 2025-07-15
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, X } from "lucide-react";
import jsPDF from "jspdf";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface OrderLite {
  id: number | string;
  customer: string;
  date: string;
  total: string;
}

interface PackingListGeneratorProps {
  order: OrderLite | null;
  onClose: () => void;
  onGenerated: (orderId: number | string) => void;
}

async function getShopCredentials() {
  const email = localStorage.getItem("user_email");
  const userType = localStorage.getItem("user_type");
  if (!email) throw new Error("No user email in localStorage");

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

    return { shop: shopRow.shopify_domain, token: shopRow.shopify_access_token };
  }

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

  return { shop: shopRow.shopify_domain, token: shopRow.shopify_access_token };
}

async function fetchOrderDetails(orderId: number | string) {
  const backend = import.meta.env.VITE_BACKEND_ENDPOINT;
  const { shop, token } = await getShopCredentials();

  const res = await fetch(`${backend}/shopify/orders/details`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shop, accessToken: token, orderId }),
  });

  if (!res.ok) throw new Error(`Order details request failed: ${res.status}`);
  return res.json(); // { order , shop }
}

function generatePackingPDF(
  order: any,
  shop: any,
  netWeightKg: string,
  grossWeightKg: string
) {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const L = 10, R = 200, pageW = 210, usableW = R - L;

  doc.setFontSize(14).setFont(undefined, "bold");
  doc.text("PACKING LIST", pageW / 2, 15, { align: "center" });

  const headerTop = 20, headerHeight = 40, colW = usableW / 3;
  doc.rect(L, headerTop, usableW, headerHeight);
  doc.line(L + colW, headerTop, L + colW, headerTop + headerHeight);
  doc.line(L + colW * 2, headerTop, L + colW * 2, headerTop + headerHeight);
  doc.line(L + colW * 2, headerTop + headerHeight / 2, R, headerTop + headerHeight / 2);

  doc.setFontSize(8).setFont(undefined, "normal");
  let y = headerTop + 4;
  const addLine = (txt: string) => { doc.text(txt, L + 2, y); y += 4; };
  addLine("Exporter");
  addLine(shop.name || "Your Store");
  if (shop.address1) addLine(shop.address1);
  if (shop.city) addLine(`${shop.city}${shop.province ? ", " + shop.province : ""} ${shop.zip || ""}`);
  if (shop.phone) addLine(shop.phone);
  if (shop.email) addLine(shop.email);

  if (shop.logo) {
    try {
      doc.addImage(shop.logo, "PNG", L + colW + colW / 2 - 15, headerTop + 10, 30, 15);
    } catch { }
  }

  const rightX = L + colW * 2 + 2;
  let ry = headerTop + 4;
  const addRight = (label: string, val: string) => {
    doc.text(`${label}:`, rightX, ry);
    doc.text(String(val), rightX + 40, ry);
    ry += 4;
  };
  addRight("Invoice #", String(order.order_number ?? order.id));
  addRight("Date", new Date(order.created_at || Date.now()).toLocaleDateString());
  addRight("Page", "1 of 1");

  ry = headerTop + headerHeight / 2 + 4;
  addRight("B/L #", "");
  addRight("Buyer Ref", "");

  const consigTop = headerTop + headerHeight + 2, consigHeight = 30;
  doc.rect(L, consigTop, usableW, consigHeight);
  doc.line(L, consigTop + consigHeight / 2, R, consigTop + consigHeight / 2);

  doc.setFontSize(8).setFont(undefined, "bold");
  doc.text("Consignee:", L + 2, consigTop + 4);
  doc.setFont(undefined, "normal");
  const ship = order.shipping_address || {};
  const consigLines = [
    `${ship.first_name || ""} ${ship.last_name || ""}`.trim() || " ",
    ship.address1 || " ",
    `${ship.city || ""}${ship.province ? ", " + ship.province : ""} ${ship.zip || ""}`.trim() || " ",
    ship.country || " ",
  ];
  consigLines.forEach((l, i) => doc.text(l, L + 2, consigTop + 8 + i * 4));

  doc.setFont(undefined, "bold").text("Dispatch Info:", L + usableW / 2 + 2, consigTop + 4);
  doc.setFont(undefined, "normal").text("Mode: Sea", L + usableW / 2 + 2, consigTop + 8);

  const tableTop = consigTop + consigHeight + 4;
  doc.setFontSize(8);
  doc.rect(L, tableTop, usableW, 8);

  const colDesc = 70, colPid = 30, colQty = 25, colNet = 30, colGross = 30;
  const colBreaks = [colDesc, colDesc + colPid, colDesc + colPid + colQty, colDesc + colPid + colQty + colNet];
  colBreaks.forEach((x) => doc.line(L + x, tableTop, L + x, tableTop + 8));

  doc.setFont(undefined, "bold");
  doc.text("Description of Goods", L + 2, tableTop + 5);
  doc.text("Product ID", L + colDesc + 2, tableTop + 5);
  doc.text("Qty / Unit", L + colDesc + colPid + 2, tableTop + 5);
  doc.text("Net Wt (kg)", L + colDesc + colPid + colQty + 2, tableTop + 5);
  doc.text("Gross Wt (kg)", R - 2, tableTop + 5, { align: "right" });

  let curY = tableTop + 8;
  doc.setFont(undefined, "normal");
  const qtyTotal = (order.line_items || []).reduce((t: number, li: any) => t + (li.quantity || 0), 0);

  (order.line_items || []).forEach((li: any) => {
    const descLines = doc.splitTextToSize(String(li.title || "Item"), colDesc - 2);
    const rowH = descLines.length * 4;

    doc.rect(L, curY, usableW, rowH);
    colBreaks.forEach((x) => doc.line(L + x, curY, L + x, curY + rowH));
    descLines.forEach((l: string, idx: number) => doc.text(l, L + 2, curY + 4 * (idx + 1) - 1));

    doc.text(String(li.product_id ?? li.sku ?? "—"), L + colDesc + 2, curY + 4);
    doc.text(`${li.quantity || 1} ${li.unit_of_measurement || ""}`.trim(), L + colDesc + colPid + 2, curY + 4);
    doc.text(netWeightKg, L + colDesc + colPid + colQty + 2, curY + 4);
    doc.text(grossWeightKg, R - 2, curY + 4, { align: "right" });

    curY += rowH;
    if (curY + 50 > 280) {
      doc.addPage();
      curY = 20;
    }
  });

  const footerTop = 240;
  doc.rect(L, footerTop, usableW, 12);
  doc.line(L + colDesc + colPid, footerTop, L + colDesc + colPid, footerTop + 12);
  doc.line(L + colDesc + colPid + colQty, footerTop, L + colDesc + colPid + colQty, footerTop + 12);

  doc.setFont(undefined, "bold").text("Total This Page", L + 2, footerTop + 8);
  doc.text(String(qtyTotal), L + colDesc + colPid + 2, footerTop + 8);
  doc.text(netWeightKg, L + colDesc + colPid + colQty + 2, footerTop + 8);
  doc.text(grossWeightKg, R - 2, footerTop + 8, { align: "right" });

  const foot2Top = footerTop + 12;
  doc.rect(L, foot2Top, usableW, 12);
  doc.line(L + colDesc + colPid, foot2Top, L + colDesc + colPid, foot2Top + 12);
  doc.line(L + colDesc + colPid + colQty, foot2Top, L + colDesc + colPid + colQty, foot2Top + 12);
  doc.text("Consignment Total", L + 2, foot2Top + 8);
  doc.text(String(qtyTotal), L + colDesc + colPid + 2, foot2Top + 8);
  doc.text(netWeightKg, L + colDesc + colPid + colQty + 2, foot2Top + 8);
  doc.text(grossWeightKg, R - 2, foot2Top + 8, { align: "right" });

  const signTop = foot2Top + 15;
  doc.rect(L + usableW / 2, signTop, usableW / 2, 25);
  doc.setFont(undefined, "normal").text("Signatory Company", L + usableW / 2 + 2, signTop + 5);
  doc.text(shop.name || "Your Store", L + usableW / 2 + 2, signTop + 10);
  doc.text("Name of Authorized Signatory:", L + usableW / 2 + 2, signTop + 18);
  doc.setFont(undefined, "bold").text(String(shop.contact_name || ""), R - 2, signTop + 18, { align: "right" });

  doc.save(`PackingList_${String(order.order_number || order.id)}.pdf`);
}

export const PackingListGenerator: React.FC<PackingListGeneratorProps> = ({
  order,
  onClose,
  onGenerated,
}) => {
  const [netWeight, setNetWeight] = useState("");
  const [grossWeight, setGrossWeight] = useState("");
  const [busy, setBusy] = useState(false);

  if (!order) return null;

  const handleGenerate = async () => {
    if (!netWeight || !grossWeight) {
      alert("Please enter both Net and Gross weight.");
      return;
    }
    try {
      setBusy(true);
      const { order: fullOrder, shop } = await fetchOrderDetails(order.id);
      generatePackingPDF(fullOrder, shop, netWeight, grossWeight);
      onGenerated(order.id);
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Could not generate packing list.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Generate Packing List</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2 mb-4 text-sm">
          <div>Order #: <span className="font-mono">{order.id}</span></div>
          <div>Date: <span className="font-mono">{order.date}</span></div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Net Weight (kg)</label>
            <Input type="number" min="0" value={netWeight} onChange={(e) => setNetWeight(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Gross Weight (kg)</label>
            <Input type="number" min="0" value={grossWeight} onChange={(e) => setGrossWeight(e.target.value)} />
          </div>
        </div>

        <Button
          className="w-full bg-emerald-600 hover:bg-emerald-700"
          onClick={handleGenerate}
          disabled={busy}
        >
          {busy ? (
            <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" />
            </svg>
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {busy ? "Generating…" : "Generate & Download"}
        </Button>
      </div>
    </div>
  );
};

export default PackingListGenerator;
