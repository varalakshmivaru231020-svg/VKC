import { db } from "@/lib/db";

interface OrderForWhatsApp {
  id: string;
  orderNumber: string;
  totalAmount: string | number;
  shippingAddress: unknown;
  userId: string | null;
}

export async function sendOrderConfirmationWhatsApp(order: OrderForWhatsApp): Promise<void> {
  const keys = ["whatsapp_phone_id", "whatsapp_token", "whatsapp_api_url"];
  const rows = await db.siteSetting.findMany({ where: { key: { in: keys } } });
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  const phoneId = settings.whatsapp_phone_id;
  const token = settings.whatsapp_token;
  if (!phoneId || !token) return;

  const apiUrl =
    settings.whatsapp_api_url ||
    `https://graph.facebook.com/v18.0/${phoneId}/messages`;

  // Resolve phone + name from user record or shipping address JSON
  const addr = (order.shippingAddress ?? {}) as Record<string, string>;
  let toPhone: string | null = addr.phone ?? null;
  let customerName: string = addr.fullName ?? "Customer";

  if (order.userId) {
    const user = await db.user.findUnique({
      where: { id: order.userId },
      select: { phone: true, firstName: true, lastName: true },
    });
    if (user?.phone) toPhone = user.phone;
    if (user?.firstName) {
      customerName = [user.firstName, user.lastName].filter(Boolean).join(" ");
    }
  }

  if (!toPhone) return;

  // Meta API expects E.164 without the leading +
  const recipient = toPhone.replace(/^\+/, "");

  const total = `₹${Number(order.totalAmount).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

  const payload = {
    to: recipient,
    recipient_type: "individual",
    type: "template",
    template: {
      language: { policy: "deterministic", code: "en" },
      name: "order_confirmation",
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: customerName },
            { type: "text", text: order.orderNumber },
            { type: "text", text: total },
          ],
        },
        {
          type: "button",
          sub_type: "url",
          index: 0,
          parameters: [
            // Dynamic tail appended to the button URL set in the template
            { type: "text", text: order.id },
          ],
        },
      ],
    },
  };

  await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}
