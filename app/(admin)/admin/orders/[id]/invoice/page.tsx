import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

function getSettings() {
  return db.siteSetting.findMany().then((rows) => {
    const m: Record<string, string> = {};
    rows.forEach((r) => (m[r.key] = r.value));
    return m;
  });
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const order = await db.order.findUnique({ where: { id: params.id }, select: { orderNumber: true } });
  return { title: order ? `Invoice #${order.orderNumber}` : "Invoice" };
}

const css = `
  .inv-root { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1a1a1a; background: white; }
  .inv-toolbar { background: #1F2937; padding: 12px 24px; position: sticky; top: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; }
  .inv-toolbar span { color: #9CA3AF; font-size: 13px; }
  .inv-print-btn { background: #8B1A2E; color: white; border: none; padding: 9px 22px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; letter-spacing: 0.3px; }
  .inv-print-btn:hover { opacity: 0.88; }
  .page { max-width: 800px; margin: 0 auto; padding: 32px; }
  .inv-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #8B1A2E; }
  .logo-area h1 { font-size: 22px; font-weight: 700; color: #8B1A2E; letter-spacing: -0.5px; }
  .logo-area p { font-size: 10px; color: #6B7280; margin-top: 2px; }
  .invoice-meta { text-align: right; }
  .invoice-no { font-size: 16px; font-weight: 700; color: #111827; }
  .invoice-label { font-size: 10px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 1px; }
  .invoice-meta p { font-size: 11px; color: #374151; margin-top: 3px; }
  .addresses { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  .addr-box { background: #F9FAFB; border-radius: 8px; padding: 14px; border: 1px solid #E5E7EB; }
  .addr-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #8B1A2E; margin-bottom: 6px; }
  .addr-box p { font-size: 11px; color: #374151; line-height: 1.6; }
  .addr-nm { font-weight: 600; color: #111827; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  thead tr { background: #8B1A2E; }
  thead th { color: white; padding: 10px 12px; text-align: left; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; }
  thead th:last-child { text-align: right; }
  tbody tr { border-bottom: 1px solid #F3F4F6; }
  tbody tr:nth-child(even) { background: #FAFAFA; }
  tbody td { padding: 10px 12px; font-size: 11px; color: #374151; vertical-align: top; }
  tbody td:last-child { text-align: right; font-weight: 600; color: #111827; }
  .totals { display: flex; justify-content: flex-end; }
  .totals-box { width: 280px; }
  .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; color: #374151; border-bottom: 1px solid #F3F4F6; }
  .totals-row.discount { color: #059669; }
  .totals-row.grand { font-weight: 700; font-size: 14px; color: #111827; border-bottom: none; margin-top: 8px; padding-top: 10px; border-top: 2px solid #E5E7EB; }
  .gst-note { font-size: 10px; color: #6B7280; text-align: right; margin-top: 6px; }
  .payment-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; }
  .prepaid { background: #DCFCE7; color: #15803D; }
  .cod { background: #FEF3C7; color: #92400E; }
  .footer-section { margin-top: 32px; padding-top: 16px; border-top: 1px solid #E5E7EB; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .footer-section p { font-size: 10px; color: #6B7280; line-height: 1.6; }
  .footer-lbl { font-weight: 700; color: #374151; font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
  .thank-you { text-align: center; margin-top: 24px; font-size: 11px; color: #9CA3AF; }
  .tracking-section { background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; }
  .tracking-section p { font-size: 11px; color: #1E40AF; }
  @media print {
    .inv-toolbar { display: none !important; }
    body * { visibility: hidden; }
    .inv-root, .inv-root * { visibility: visible; }
    .inv-root { position: absolute; left: 0; top: 0; width: 100%; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const [order, settings] = await Promise.all([
    db.order.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        items: true,
      },
    }),
    getSettings(),
  ]);

  if (!order) notFound();

  const addr          = order.shippingAddress as any;
  const storeName     = settings["store_name"]     || "Vijaylakshmi Sarees";
  const storePhone    = settings["store_phone"]    || "";
  const storeEmail    = settings["store_email"]    || "";
  const storeAddress  = settings["store_address"]  || "";
  const storeGST      = settings["store_gst"]      || "";
  const returnAddress = settings["return_address"] || storeAddress;
  const storeLogo     = settings["store_logo"]     || "";

  const fmtDate = (d: Date | string | null) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—";

  const isPrepaid = order.paymentStatus === "PAID";

  return (
    <div className="inv-root">
      {/* dangerouslySetInnerHTML prevents React hydration text-content mismatch on CSS strings */}
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* Print toolbar */}
      <div className="inv-toolbar">
        <span>Invoice #{order.orderNumber}</span>
        <button id="inv-print-btn" className="inv-print-btn">🖨 Print Invoice</button>
      </div>
      <script dangerouslySetInnerHTML={{ __html: `document.getElementById('inv-print-btn').onclick=()=>window.print()` }} />

      <div className="page">
        <div className="inv-header">
          <div className="logo-area">
            <h1>{storeName}</h1>
            <p>Handcrafted Indian Sarees</p>
            {storeAddress && <p style={{ marginTop: 6, maxWidth: 220 }}>{storeAddress}</p>}
            {storePhone && <p>📞 {storePhone}</p>}
            {storeEmail && <p>✉ {storeEmail}</p>}
            {storeGST && <p>GSTIN: {storeGST}</p>}
          </div>
          <div className="invoice-meta">
            {storeLogo && (
              <img src={storeLogo} alt={storeName} style={{ maxHeight: 56, maxWidth: 160, objectFit: "contain", marginBottom: 10, display: "block", marginLeft: "auto" }} />
            )}
            <div className="invoice-label">Tax Invoice</div>
            <div className="invoice-no">#{order.orderNumber}</div>
            <p>Date: {fmtDate(order.createdAt)}</p>
            {order.shippedAt && <p>Shipped: {fmtDate(order.shippedAt)}</p>}
            {order.deliveredAt && <p>Delivered: {fmtDate(order.deliveredAt)}</p>}
            <div style={{ marginTop: 10 }}>
              <span className={`payment-badge ${isPrepaid ? "prepaid" : "cod"}`}>
                {isPrepaid ? "✓ Prepaid" : "Cash on Delivery"}
              </span>
            </div>
          </div>
        </div>

        <div className="addresses">
          <div className="addr-box">
            <div className="addr-lbl">Bill To</div>
            <p className="addr-nm">{addr?.fullName || [order.user?.firstName, order.user?.lastName].filter(Boolean).join(" ") || "—"}</p>
            {addr && <>
              <p>{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}</p>
              <p>{addr.city}, {addr.state} — {addr.pincode}</p>
              <p>{addr.country || "India"}</p>
            </>}
            {addr?.phone && <p>📞 {addr.phone}</p>}
            {order.user?.email && <p>✉ {order.user.email}</p>}
          </div>
          <div className="addr-box">
            <div className="addr-lbl">Ship To</div>
            <p className="addr-nm">{addr?.fullName || "—"}</p>
            {addr && <>
              <p>{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}</p>
              <p>{addr.city}, {addr.state} — {addr.pincode}</p>
              <p>{addr.country || "India"}</p>
              {addr.phone && <p>📞 {addr.phone}</p>}
            </>}
          </div>
        </div>

        {(order.trackingNumber || order.courierPartner) && (
          <div className="tracking-section">
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Shipping Details</p>
            {order.courierPartner && <p>Courier: <strong>{order.courierPartner}</strong></p>}
            {order.trackingNumber && <p>Tracking No: <strong style={{ fontFamily: "monospace" }}>{order.trackingNumber}</strong></p>}
            {order.trackingUrl && <p>Track at: {order.trackingUrl}</p>}
          </div>
        )}

        <table>
          <thead>
            <tr>
              <th style={{ width: 32 }}>#</th>
              <th>Item Description</th>
              <th style={{ textAlign: "center" }}>Qty</th>
              <th style={{ textAlign: "right" }}>Unit Price</th>
              <th style={{ textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={item.id}>
                <td style={{ color: "#9CA3AF" }}>{i + 1}</td>
                <td>
                  <div style={{ fontWeight: 600, color: "#111827" }}>{item.productName}</div>
                  <div style={{ color: "#9CA3AF", fontSize: 10 }}>{item.variantColor}{item.sareeCode ? ` · ${item.sareeCode}` : ""}</div>
                </td>
                <td style={{ textAlign: "center" }}>{item.quantity}</td>
                <td style={{ textAlign: "right" }}>{formatINR(Number(item.unitPrice))}</td>
                <td style={{ textAlign: "right" }}>{formatINR(Number(item.totalPrice))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="totals">
          <div className="totals-box">
            <div className="totals-row"><span>Subtotal</span><span>{formatINR(Number(order.subtotal))}</span></div>
            {Number(order.discountAmount) > 0 && (
              <div className="totals-row discount">
                <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                <span>−{formatINR(Number(order.discountAmount))}</span>
              </div>
            )}
            <div className="totals-row">
              <span>Shipping</span>
              <span>{Number(order.shippingAmount) === 0 ? "Free" : formatINR(Number(order.shippingAmount))}</span>
            </div>
            {Number(order.walletAmountUsed) > 0 && (
              <div className="totals-row discount">
                <span>Wallet Credit</span>
                <span>−{formatINR(Number(order.walletAmountUsed))}</span>
              </div>
            )}
            <div className="totals-row grand">
              <span>Grand Total</span>
              <span style={{ color: "#8B1A2E" }}>{formatINR(Number(order.totalAmount))}</span>
            </div>
            {Number(order.taxAmount) > 0 && (
              <div className="totals-row">
                <span>(GST included)</span>
                <span>{formatINR(Number(order.taxAmount))}</span>
              </div>
            )}
            <p className="gst-note">* Inclusive of all applicable taxes (GST){storeGST ? ` · GSTIN: ${storeGST}` : ""}</p>
          </div>
        </div>

        <div style={{ marginTop: 12, fontSize: 11, color: "#6B7280" }}>
          Payment Method: <strong style={{ color: "#374151" }}>
            {order.paymentMethod?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "—"}
          </strong>
          {order.paymentId && <> · Ref: <span style={{ fontFamily: "monospace" }}>{order.paymentId}</span></>}
        </div>

        <div className="footer-section">
          <div>
            <p className="footer-lbl">Terms &amp; Conditions</p>
            <p>• Goods once sold are not returnable unless defective.</p>
            <p>• Returns accepted within 7 days of delivery in original condition.</p>
            <p>• This is a computer-generated invoice and does not require a signature.</p>
          </div>
          <div>
            <p className="footer-lbl">Customer Support</p>
            {storePhone && <p>📞 {storePhone}</p>}
            {storeEmail && <p>✉ {storeEmail}</p>}
            {returnAddress && <p style={{ marginTop: 8 }}><strong>Return Address:</strong><br />{returnAddress}</p>}
          </div>
        </div>

        <div className="thank-you">
          <p>Thank you for shopping with {storeName} 🙏</p>
          <p style={{ marginTop: 4 }}>We hope you love your saree!</p>
        </div>
      </div>
    </div>
  );
}
