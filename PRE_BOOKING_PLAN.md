# Product Pre-Booking System — Enterprise Design Spec

Companion to [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md). Written against the **actual** stack in this repo — Next.js 14 (App Router) + Prisma 5 + PostgreSQL, NextAuth v5, Razorpay/Cashfree/ICICI, Shiprocket/DTDC/Delhivery, WhatsApp (Meta Graph API) + MSG91 for notifications, Flutter mobile client on `app/api/v1/*`. All file paths, model names, and column names below are grounded in the current `prisma/schema.prisma` and route handlers, not invented.

---

## 0. Scope & Ground Truth

**What "Out of Stock" means today:** stock lives on `ProductVariant` (`stockQty`, `reservedQty`), not `Product`. `available = stockQty - reservedQty` is computed client-side in [`ProductDetailClient.tsx:44`](app/(marketing)/shop/[slug]/ProductDetailClient.tsx#L44); when `available <= 0` the entire buy-box (qty selector + Add to Cart + Buy Now) is currently **not rendered at all**. `ProductCard.tsx` shows a "Sold Out" badge when *every* variant of a product is at 0. This spec fills that empty state with a Pre-Booking flow.

**Two facts that shape every decision below:**

1. **Stock is never atomically decremented today.** `stockQty` is only ever *incremented* (on cancel/return, see `app/api/admin/orders/[id]/route.ts` and `app/api/v1/orders/[id]/cancel/route.ts`). There is no transactional oversell guard anywhere in the current checkout path. Pre-booking introduces a hard capacity constraint (the merchant can only manufacture N units) that **must** be enforced atomically — this is new rigor, not an extension of an existing pattern. See §4.1.
2. **No order-splitting / multi-shipment support exists.** `Order.trackingNumber`/`courierPartner`/`shiprocketShipmentId` are singular columns — one shipment per order. A cart mixing an in-stock saree and a pre-booked saree cannot be shipped together without holding the in-stock item hostage. Rather than build multi-shipment support (large, separate initiative), this spec **forbids mixing order types in one checkout** and splits at the cart level instead. See §2.3.

---

## 1. Business Requirements & Rules

| # | Rule |
|---|---|
| BR-1 | Admin can enable Pre-Booking per **product**, with three modes: **Off**, **Auto** (pre-booking UI appears only when the selected variant's `available <= 0`), **Always On** (product is pre-booking-only regardless of stock — for made-to-order or not-yet-manufactured collections). |
| BR-2 | Stock availability is still evaluated **per color variant** (existing model). If a product has 3 colors and only 1 is out of stock, only that color shows the Pre-Booking CTA; the other 2 sell normally. |
| BR-3 | Customers must see an unambiguous "Pre-Booking" badge/banner wherever the product appears (PDP, product card, cart, checkout, order confirmation, order tracking, invoice) — never silently sold as a normal in-stock item. |
| BR-4 | Delivery estimate for pre-booked items is longer than standard delivery and is shown as a range (e.g. "Ships in 15–25 days") or a fixed expected date, admin-configurable per product. |
| BR-5 | Admin can cap total pre-bookable units per product (procurement capacity) and/or per order (anti-hoarding). Both optional/unlimited if left blank. |
| BR-6 | Payment: admin chooses **Full payment upfront** or **Partial deposit + balance on ready-to-ship**, per product. COD is disabled for pre-booking orders by default (global kill-switch, see §9). |
| BR-7 | A cart/checkout may contain **either** all-standard **or** all-pre-booking items, never both — see §2.3 for the UX. |
| BR-8 | Customers can self-cancel a pre-booking free of charge within a configurable grace window (default 24h) after booking. After the window (or once procurement has started), cancellation may be admin-mediated and can carry a cancellation fee deducted from the refund. |
| BR-9 | Admin can mark a pre-booking **Unable to Fulfill** (e.g. weaver couldn't deliver, discontinued) at any point before shipment, triggering an automatic full refund and customer notification — no fee applies to merchant-initiated cancellations. |
| BR-10 | Admin can decide, per product, whether pre-booked (often made-to-order) items are returnable after delivery. |
| BR-11 | When a product's stock is replenished while in `AUTO` pre-booking mode, new pre-booking stops automatically for that variant (customers just buy normally); existing open pre-bookings are unaffected and continue through procurement. |
| BR-12 | All of the above must work identically on the Flutter mobile app (`api/v1/*`), not just the Next.js storefront. |

---

## 2. Key Design Decisions

### 2.1 Reuse `Order`/`OrderItem`, don't fork a parallel entity
Pre-booking orders are still orders — they need addresses, payment, coupons, wallet, GST, shipping. Forking a `PreBookingOrder` model would duplicate all of that. Instead: add `Order.orderType` (`STANDARD | PRE_BOOKING`) and a `PreBookingStatus` sub-lifecycle on `Order`, following the exact precedent already in this codebase for `OrderReturn` (a specialized workflow bolted onto the same `Order`/`OrderItem` backbone) and for the stage-timestamp/actor-pair pattern already used for `confirmedAt/confirmedById`, `shippedAt/shippedById`, etc.

### 2.2 Toggle lives on `Product`, availability is still evaluated on `ProductVariant`
Matches BR-1/BR-2 and keeps the admin form simple (one section, same place `isFeatured`/`isActive` toggles already live in `NewProductClient.tsx`/`EditProductClient.tsx`). A capacity counter (`preBookedQty`) is added to `ProductVariant`, mirroring the existing `reservedQty` pattern, because capacity is a per-color manufacturing constraint, not a per-product one.

> **Phase 2 (not in this scope):** a `PreBookingOverride` enum on `ProductVariant` (`INHERIT | FORCE_ON | FORCE_OFF`) for stores that want to force pre-booking on one color while another is `AUTO`. Flagged in §14 as an open decision — current design assumes product-level policy + variant-level trigger is sufficient for launch.

### 2.3 Cart segregation instead of split shipments
Because the schema has no multi-shipment support (§0), a cart can hold pre-booking items and standard items simultaneously (so customers aren't blocked from browsing/adding), but the **Cart page visually splits them into two groups**, each with its own "Proceed to Checkout" button, and **checkout only ever creates one `Order` of one `orderType`**. The checkout API independently re-validates this (rejects a mixed payload) as defense in depth — never trust the client store alone. See §8.1.

### 2.4 Atomic capacity reservation
`preBookingMaxTotalQty` (if set) must not be oversold under concurrent checkouts. Implemented as a conditional guarded update inside a serializable Prisma transaction — see §4.1 for the exact pattern. This is intentionally more rigorous than the existing `stockQty`/`reservedQty` handling elsewhere in the app (§0.1) because pre-booking makes a real manufacturing promise to the customer; overselling it is a direct cost to the merchant, not just a data-quality issue.

### 2.5 Deposit + balance payment reuses the existing gateway integrations
No new payment provider. A deposit is just a Razorpay/Cashfree/ICICI order for a smaller amount at booking time; the balance is a **second** gateway order against the same `Order` row, created on demand when the customer clicks "Pay Balance" (surfaced via a WhatsApp link, mirroring `sendOrderConfirmationWhatsApp`). See §4.4.

### 2.6 Notifications follow the existing WhatsApp/SiteSetting convention, not email
`resend`/email is present in `package.json` but **unwired** anywhere in the codebase — building pre-booking notifications on top of it would mean shipping the first email integration as a side effect of this feature. Instead, every pre-booking lifecycle event sends a WhatsApp template message via `lib/whatsapp.ts`-style helpers, configured through `SiteSetting` exactly like `whatsapp_phone_id`/`whatsapp_token` today. See §10.

---

## 3. Data Model — Prisma Schema Diff

All additions; no destructive changes to existing columns. Defaults are chosen so existing rows/behavior are unaffected until an admin explicitly opts a product in (`preBookingMode` defaults to `OFF`).

### 3.1 New enums

```prisma
enum OrderType {
  STANDARD
  PRE_BOOKING
}

enum PreBookingMode {
  OFF
  AUTO_ON_OUT_OF_STOCK
  ALWAYS_ON
}

enum PreBookingPaymentPolicy {
  FULL_UPFRONT
  PARTIAL_DEPOSIT
}

// Lifecycle of a PRE_BOOKING order, tracked alongside (not instead of) OrderStatus.
// OrderStatus only progresses past CONFIRMED once PreBookingStatus reaches FULFILLED.
enum PreBookingStatus {
  REQUESTED           // order created, payment (deposit or full) not yet confirmed
  CONFIRMED           // payment confirmed, booking accepted
  IN_PROCUREMENT      // admin has started manufacturing/sourcing
  READY_TO_SHIP        // stock physically ready
  BALANCE_DUE          // ready, but PARTIAL_DEPOSIT policy — waiting on balance payment
  FULFILLED            // balance settled (or n/a) — handed back to normal OrderStatus flow
  CANCELLED             // customer- or admin-cancelled before fulfillment
  UNABLE_TO_FULFILL     // merchant-initiated cancellation (BR-9)
}
```

### 3.2 `Product` — new columns

```prisma
model Product {
  // ...existing columns unchanged...

  preBookingMode                PreBookingMode           @default(OFF)
  preBookingPaymentPolicy       PreBookingPaymentPolicy  @default(FULL_UPFRONT)
  preBookingDepositPercent      Decimal?                 @db.Decimal(5, 2)   // required + 1-99 when policy = PARTIAL_DEPOSIT
  preBookingEtaMinDays          Int?                                          // e.g. 15
  preBookingEtaMaxDays          Int?                                          // e.g. 25 (must be >= min)
  preBookingExpectedDate        DateTime?                @db.Date             // optional fixed date; if set, overrides the min/max range in UI copy
  preBookingMaxQtyPerOrder      Int?                                          // null = fall back to store-wide default cart qty cap
  preBookingMaxTotalQty         Int?                                          // null = unlimited slots
  preBookingDisclaimer          String?                  @db.VarChar(500)     // customer-facing note, e.g. "Handwoven to order"
  preBookingReturnsAllowed      Boolean                  @default(true)
  preBookingFreeCancelHours     Int                       @default(24)
  preBookingCancelFeePercent    Decimal                   @default(0) @db.Decimal(5, 2)  // applied to refund after free-cancel window, once IN_PROCUREMENT+
  preBookingAutoDisableOnRestock Boolean                  @default(true)       // BR-11

  @@map("products")
}
```

### 3.3 `ProductVariant` — new column

```prisma
model ProductVariant {
  // ...existing columns unchanged...

  preBookedQty Int @default(0)   // running total of units currently booked & not cancelled/unable-to-fulfill; mirrors reservedQty semantics, caps against preBookingMaxTotalQty

  @@map("product_variants")
}
```

### 3.4 `Order` — new columns

```prisma
model Order {
  // ...existing columns unchanged...

  orderType                 OrderType          @default(STANDARD)

  preBookingStatus           PreBookingStatus?
  preBookingEtaDate          DateTime?           // snapshotted at booking time from Product.preBookingExpectedDate / eta range midpoint; admin-editable as procurement progresses
  preBookingDisclaimerSnap   String?  @db.VarChar(500)  // snapshot of Product.preBookingDisclaimer at order time (product config can change later)
  preBookingReturnsAllowedSnap Boolean @default(true)

  preBookingDepositAmount    Decimal? @db.Decimal(10, 2)   // null when policy = FULL_UPFRONT
  preBookingBalanceAmount    Decimal? @db.Decimal(10, 2)
  preBookingBalancePaymentId String?  @db.VarChar(100)
  preBookingBalancePaidAt    DateTime?
  preBookingBalanceDueReminderSentAt DateTime?

  preBookingCancelReason      String?  @db.VarChar(500)
  preBookingCancelFeeAmount   Decimal? @db.Decimal(10, 2)
  preBookingCancelledBy       String?  @db.VarChar(20)   // CUSTOMER | ADMIN

  // Stage timestamp/actor pairs, following the exact convention already used
  // for confirmedAt/confirmedById etc. above.
  preBookingConfirmedAt       DateTime?
  preBookingConfirmedById     String?
  preBookingProcurementAt     DateTime?
  preBookingProcurementById   String?
  preBookingReadyAt           DateTime?
  preBookingReadyById         String?
  preBookingFulfilledAt       DateTime?
  preBookingFulfilledById     String?
  preBookingCancelledAt       DateTime?
  preBookingCancelledById     String?

  @@index([orderType, preBookingStatus, preBookingEtaDate])
  @@map("orders")
}
```

### 3.5 New `SiteSetting` rows (config, not schema — admin-editable like `whatsapp_phone_id`)

| Key | Type | Default | Purpose |
|---|---|---|---|
| `prebooking_feature_enabled` | boolean | `false` | Global kill-switch — see §12 rollout |
| `prebooking_cod_allowed` | boolean | `false` | BR-6 |
| `prebooking_balance_due_grace_days` | number | `7` | Days after `READY_TO_SHIP`/`BALANCE_DUE` before auto-cancel-and-refund-deposit |
| `prebooking_balance_reminder_days` | number | `2` | Send a WhatsApp reminder if balance unpaid after N days |

### 3.6 Migration notes

- `prisma migrate dev --name add_pre_booking` generates one additive migration; all new columns are nullable or have safe defaults, so it is a zero-downtime, backward-compatible deploy — no backfill script needed (`preBookingMode` defaults `OFF` for every existing product).
- No changes to `OrderItem` — pre-booking is tracked at `Order` granularity per the decision in §2.1, since §2.3 guarantees an order's items are homogeneous in type.
- Prisma `$transaction` isolation: the capacity-reservation transaction in §4.1 needs `Serializable` (or at minimum row-level locking via a conditional `updateMany`) — confirm the Postgres connection pool (pgbouncer/transaction mode, if used) supports it before enabling in production; flag to DevOps during rollout.

---

## 4. Backend Logic — Core Flows

### 4.1 Atomic pre-booking slot reservation (new rigor — see §0.1)

Runs inside the checkout route, before creating the Razorpay/Cashfree/ICICI order, so a payment is never initiated for a slot that's already gone:

```ts
// lib/prebooking/reserveSlots.ts
export async function reservePreBookingSlots(
  tx: Prisma.TransactionClient,
  variantId: string,
  qty: number
) {
  const variant = await tx.productVariant.findUnique({
    where: { id: variantId },
    select: { preBookedQty: true, product: { select: { preBookingMaxTotalQty: true, preBookingMode: true } } },
  });
  if (!variant || variant.product.preBookingMode === "OFF") {
    throw new PreBookingError("NOT_PREBOOKABLE");
  }
  const cap = variant.product.preBookingMaxTotalQty;

  // Conditional update: only succeeds if capacity still allows it. The WHERE
  // clause re-checks preBookedQty at UPDATE time, so two concurrent requests
  // racing for the last slot cannot both succeed — the loser's updateMany
  // affects 0 rows and we reject that request. This is the pattern the rest
  // of the codebase does NOT have for stockQty (see §0.1) — deliberate here
  // because overselling a manufacturing promise is a real merchant cost.
  const result = await tx.productVariant.updateMany({
    where: cap
      ? { id: variantId, preBookedQty: { lte: cap - qty } }
      : { id: variantId },
    data: { preBookedQty: { increment: qty } },
  });

  if (result.count === 0) {
    throw new PreBookingError("SLOTS_FULL");
  }
}
```

Release (on cancel / unable-to-fulfill) mirrors the existing restock pattern in `app/api/admin/orders/[id]/route.ts`:

```ts
await tx.productVariant.update({
  where: { id: item.variantId },
  data: { preBookedQty: { decrement: item.quantity } },
}).catch(() => {});
```

### 4.2 Checkout — creating a `PRE_BOOKING` order

New route `app/api/web/checkout/pre-booking/[gateway]/route.ts` (and `app/api/v1/checkout/pre-booking/[gateway]/route.ts` for mobile), structurally parallel to the existing `app/api/web/checkout/razorpay/route.ts` (read in full — see §0), with these differences:

1. Reject if the payload mixes `productId`s whose `preBookingMode !== OFF`-triggered items with any standard items — defense-in-depth for §2.3.
2. For each line item, run `reservePreBookingSlots` inside the same `$transaction` as `order.create`.
3. Compute `chargeAmount`: full `totalAmount` if `preBookingPaymentPolicy = FULL_UPFRONT`; `totalAmount * depositPercent / 100` (rounded to paise) if `PARTIAL_DEPOSIT`, and store `preBookingBalanceAmount = totalAmount - deposit`.
4. Set `orderType: "PRE_BOOKING"`, `preBookingStatus: "REQUESTED"`, `preBookingEtaDate` snapshot, `preBookingDisclaimerSnap`, `preBookingReturnsAllowedSnap`.
5. Reject `paymentMethod: "cod"` unless `SiteSetting.prebooking_cod_allowed = true`.
6. Create the gateway order for `chargeAmount`, not `totalAmount`.

### 4.3 Verify — flips `REQUESTED → CONFIRMED`

Same HMAC-verification code as today's `.../razorpay/verify/route.ts`, plus: on success, set `preBookingStatus: "CONFIRMED"`, `preBookingConfirmedAt/By`, and send the `prebooking_confirmation` WhatsApp template (§10). On failure, **release the reserved slots** (§4.1 decrement) since the booking never completed — this is the one case where a `REQUESTED` order must free its capacity, otherwise abandoned payment attempts permanently eat into `preBookingMaxTotalQty`.

### 4.4 Admin status transitions

Extends the existing action-dispatch pattern in `app/api/admin/orders/[id]/route.ts` (or a sibling `app/api/admin/pre-bookings/[id]/route.ts` — recommended, to keep the already-large orders handler from growing further) with the same `if (action === "...") { ... }` shape:

| Action | From → To | Side effects |
|---|---|---|
| `confirm` | `REQUESTED → CONFIRMED` | Manual override for COD/offline-verified bookings; sends `prebooking_confirmation` |
| `start_procurement` | `CONFIRMED → IN_PROCUREMENT` | Sends `prebooking_status_update` |
| `update_eta` | (any pre-fulfillment state, no transition) | Updates `preBookingEtaDate`; if pushed later than before, sends `prebooking_eta_delayed` |
| `mark_ready` | `IN_PROCUREMENT → READY_TO_SHIP` (`FULL_UPFRONT`) or `→ BALANCE_DUE` (`PARTIAL_DEPOSIT`) | `FULL_UPFRONT`: sends `prebooking_ready_no_balance`, hands off to normal Shiprocket dispatch flow. `PARTIAL_DEPOSIT`: generates a balance-payment gateway order (§4.5) and sends `prebooking_ready_balance_due` with the payment link |
| `mark_fulfilled` | `READY_TO_SHIP → FULFILLED` (auto once `BALANCE_DUE` balance is paid, see §4.5) | `Order.status` becomes eligible to progress to `PROCESSING`/`SHIPPED` via the existing status endpoint |
| `cancel` | any pre-`FULFILLED` state `→ CANCELLED` | Releases `preBookedQty` (§4.1); refund per BR-8 (fee applies if past free-cancel window and `IN_PROCUREMENT+`); reuses `cancelRefundMethod`/wallet-credit code already in `process_refund` |
| `mark_unable_to_fulfill` | any pre-`FULFILLED` state `→ UNABLE_TO_FULFILL` | Releases `preBookedQty`; **full** refund, no fee (BR-9); sends `prebooking_cancelled_refund` with an apology template; optional goodwill wallet credit (admin-entered amount) |

`validStatuses`-style guard: reject any action whose `From` doesn't match current `preBookingStatus`, mirroring the existing `if (order.status !== "RETURN_REQUESTED") return 400` checks in the return workflow.

### 4.5 Balance payment (PARTIAL_DEPOSIT policy)

- `mark_ready` creates a gateway order for `preBookingBalanceAmount` and stores its id as `preBookingBalancePaymentId`; status → `BALANCE_DUE`.
- New customer-facing endpoint `POST /api/web/checkout/pre-booking/balance/[gateway]/route.ts` — customer clicks the WhatsApp link, lands on a "Pay Balance" page, this route re-fetches (never re-creates) the stored gateway order and returns checkout params.
- `POST .../balance/[gateway]/verify/route.ts` — verifies signature, sets `preBookingBalancePaidAt`, `paymentStatus: "PAID"` (if not already), `preBookingStatus: "FULFILLED"`, `preBookingFulfilledAt/By: null` (system-triggered, no admin actor).
- **Grace + auto-cancel:** a scheduled job (see §4.6) checks orders in `BALANCE_DUE` older than `prebooking_balance_due_grace_days`; sends `prebooking_status_update` reminder at `prebooking_balance_reminder_days`, then auto-transitions to `CANCELLED` with `preBookingCancelReason: "Balance payment not received within grace period"`, refunds the deposit (minus cancel fee if policy dictates), releases slots.

### 4.6 Scheduled/background jobs

The codebase has **no queue/cron system** (Next.js has none built in; confirmed no `queue:work` equivalent). Two options, to be decided with DevOps during implementation (flagged in §14):
- **Vercel Cron** (if hosted on Vercel) hitting a protected `app/api/cron/pre-booking-sweep/route.ts` daily — handles: balance-due grace expiry (§4.5), overdue-ETA flagging for the admin dashboard (§8.2), auto-disable-on-restock sweep (BR-11, belt-and-suspenders in case a direct stock-update path is missed).
- A simple external cron (e.g. GitHub Actions scheduled workflow, or existing infra cron) calling the same protected route with a shared secret header.

Either way, the route itself is the deliverable; the trigger mechanism is an infra decision outside this app.

### 4.7 Auto-disable on restock (BR-11)

Triggered wherever `stockQty` is incremented for a variant whose product has `preBookingMode = AUTO_ON_OUT_OF_STOCK` and `preBookingAutoDisableOnRestock = true` — i.e., the admin Stock Update route (`app/api/admin/stock/route.ts`) and the return/cancel restock code paths. No state change needed on the `Product` row itself (mode stays `AUTO_ON_OUT_OF_STOCK`) — the storefront's per-variant `available <= 0` check already stops showing the Pre-Booking CTA the moment stock is positive. This is effectively free (§2.2's design already makes it self-correcting); the only addition is the §4.6 sweep as a safety net for any restock path that bypasses the standard route.

---

## 5. API Reference

### 5.1 Admin (`app/api/admin/...`)

| Method | Route | Purpose |
|---|---|---|
| `PATCH` | `/api/admin/products/[id]` | Extended request body accepts all `preBooking*` fields from §3.2 (existing generic update handler, additive) |
| `GET` | `/api/admin/pre-bookings` | List. Query: `status`, `overdue=true`, `productId`, `q` (order number/customer), `page`, `pageSize` |
| `GET` | `/api/admin/pre-bookings/[id]` | Detail — order + items + pre-booking fields + timeline |
| `PATCH` | `/api/admin/pre-bookings/[id]` | Body: `{ action, ...actionParams }` per the table in §4.4 |
| `GET` | `/api/admin/pre-bookings/export` | CSV export for finance/ops (columns: order#, product, variant, qty, policy, deposit, balance, status, eta, days-overdue) |
| `GET` | `/api/admin/sidebar-counts` | Extended to add `pendingPreBookings` (status `REQUESTED`) and `overduePreBookings` (`preBookingEtaDate < now` and status not in `FULFILLED/CANCELLED/UNABLE_TO_FULFILL`) |
| `GET` | `/api/admin/reports/pre-booking` | KPIs — see §8.2.3 |

### 5.2 Storefront web (`app/api/web/...`)

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/web/checkout/pre-booking/razorpay` | §4.2 |
| `POST` | `/api/web/checkout/pre-booking/razorpay/verify` | §4.3 |
| `POST` | `/api/web/checkout/pre-booking/cashfree` / `.../icici` (+ `verify`) | Same shape, other gateways |
| `POST` | `/api/web/checkout/pre-booking/balance/[gateway]` | §4.5 |
| `POST` | `/api/web/checkout/pre-booking/balance/[gateway]/verify` | §4.5 |

### 5.3 Mobile (`app/api/v1/...`) — parity for Flutter (BR-12)

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/v1/products/[slug]` | Response extended with `preBookingAvailable`, `preBookingMode`, `preBookingEtaLabel`, `preBookingRemainingSlots`, `preBookingPaymentPolicy`, `preBookingDepositPercent`, `preBookingDisclaimer`, `preBookingReturnsAllowed` per variant-in-context |
| `POST` | `/api/v1/checkout/pre-booking/[gateway]` (+ `verify`) | Mirrors §5.2 |
| `POST` | `/api/v1/checkout/pre-booking/balance/[gateway]` (+ `verify`) | Mirrors §5.2 |
| `GET` | `/api/v1/orders/[id]` | Response extended with all `preBooking*` order fields + a `preBookingTimeline` array for the mobile order-tracking screen |
| `POST` | `/api/v1/orders/[id]/cancel` | Extended: if `orderType = PRE_BOOKING`, apply BR-8 fee logic instead of the standard cancel-refund path |

### 5.4 Read-path fields exposed everywhere a product/variant is serialized

`lib/db/products.ts` (`getProducts`, `getProductBySlug`) and `lib/types/product.ts` (`ProductData`, `ProductVariantData`) need these **computed, not stored** fields added to every product/variant payload (web, v1, and admin list):

```ts
preBookingAvailable: boolean       // product.preBookingMode === "ALWAYS_ON" || (product.preBookingMode === "AUTO_ON_OUT_OF_STOCK" && variant.stockQty - variant.reservedQty <= 0)
preBookingRemainingSlots: number | null   // preBookingMaxTotalQty == null ? null : max(0, preBookingMaxTotalQty - variant.preBookedQty)
preBookingEtaLabel: string          // "Ships in 15–25 days" | "Expected by 12 Aug 2026" — formatted server-side so web/mobile render identical copy
```

Also audit and update every existing call site of the `inStock` filter (`variants: { some: { stockQty: { gt: 0 } } }` in `lib/db/products.ts`) to decide, per listing context, whether `preBookingAvailable` products should be included — see EC-24 in §7.

---

## 6. Validation Rules

| Field / Action | Rule | Error |
|---|---|---|
| `preBookingMode` | Enum, required | `Invalid pre-booking mode` |
| `preBookingDepositPercent` | Required, `1–99`, when `preBookingPaymentPolicy = PARTIAL_DEPOSIT`; must be `null` when `FULL_UPFRONT` | `Deposit percent must be between 1 and 99` |
| `preBookingEtaMinDays` / `Max` | Both positive integers if either set; `min <= max`; warn (not block) if `max > 180` | `Maximum ETA must be greater than or equal to minimum ETA` |
| `preBookingExpectedDate` | Must be a future date at save time | `Expected date must be in the future` |
| `preBookingMaxQtyPerOrder` | Positive integer if set | `Must be a positive whole number` |
| `preBookingMaxTotalQty` | Positive integer if set; **on edit**, if new cap `< current preBookedQty` across open orders, block save and surface the conflicting count for manual reconciliation (EC-17) | `Cannot set cap below N units already booked — resolve open bookings first` |
| `preBookingFreeCancelHours` | `0–168` (1 week max) | `Must be between 0 and 168 hours` |
| `preBookingCancelFeePercent` | `0–100` | `Must be between 0 and 100` |
| Add-to-cart qty (pre-booking item) | `1 <= qty <= min(preBookingMaxQtyPerOrder ?? ∞, preBookingRemainingSlots ?? ∞)` | `Only N pre-booking slots left` / `Maximum N per order` |
| Checkout payload | All items must share `orderType` (derived from each item's live `preBookingAvailable`); reject mixed | `Your cart contains both regular and pre-booked items — please check out separately` |
| Checkout payload | `paymentMethod !== "cod"` unless `SiteSetting.prebooking_cod_allowed` | `Cash on Delivery is not available for pre-booked items` |
| Consent checkbox | Required, must be checked, before placing a pre-booking order | `Please confirm you understand this is a pre-booked item` |
| Balance payment | Only callable when `preBookingStatus === "BALANCE_DUE"` and requester owns the order (session match or `orderNumber` + phone lookup for guest) | `This order is not awaiting a balance payment` |
| Admin action transitions | Enforce the `From` state per §4.4 table | `Cannot {action} — order is currently {status}` |
| Slot reservation | Enforced atomically per §4.1, not just at form-submit time | `These pre-booking slots just sold out — please reduce quantity` |

---

## 7. Edge Case Catalog

**Inventory & capacity**
- **EC-1** Two customers race for the last pre-booking slot simultaneously → §4.1 guarantees only one succeeds; the loser sees a friendly "slots just sold out, reduce quantity" error, not a 500.
- **EC-2** Admin lowers `preBookingMaxTotalQty` below units already booked → blocked at save time with the conflict count surfaced (§6), not silently applied.
- **EC-3** Stock is replenished mid-flight while a customer has a pre-booking item in their cart (not yet checked out) → re-validate `preBookingAvailable` at checkout time server-side; if it flipped to normal stock, either allow (still fulfillable as pre-booking) or prompt "this item is now in stock — remove from pre-booking cart?" — recommend the latter for clarity.
- **EC-4** Admin disables pre-booking (`mode → OFF`) on a product with open `REQUESTED`/`CONFIRMED`/`IN_PROCUREMENT` orders → existing orders are **not** retroactively cancelled; only blocks *new* bookings (BR-1 implies this but must be explicit in the PATCH handler — don't cascade-cancel).
- **EC-5** Variant `isActive` is toggled off while pre-booking orders reference it → admin edit form must warn ("N open pre-bookings reference this variant") rather than silently hide it from order history.

**Payment & refunds**
- **EC-6** Deposit succeeds, balance payment is attempted but fails (card declined) → order stays `BALANCE_DUE`, customer can retry; reminder/grace-expiry sweep (§4.6) still applies.
- **EC-7** Customer cancels within the free window → full refund via existing `cancelRefundMethod` (SOURCE/WALLET) logic, no fee.
- **EC-8** Customer cancels after free window, after `IN_PROCUREMENT` → refund minus `preBookingCancelFeePercent`, computed off the amount actually paid so far (deposit only, if balance unpaid).
- **EC-9** Merchant marks `UNABLE_TO_FULFILL` after balance was already paid → full refund of deposit + balance, no fee (BR-9).
- **EC-10** Coupon applied to a pre-booking order whose deposit is less than the coupon's `minOrderAmount` semantics — clarify: discount is computed against `totalAmount` (order value), not the deposit charge amount, so coupon eligibility logic is unchanged; only the *gateway charge* is a fraction.
- **EC-11** Wallet balance used alongside a deposit-policy order — wallet debit should apply to the *first* payment (deposit), reducing what's charged via gateway; balance-due amount at ready-to-ship is unaffected (already fixed at booking time) — must snapshot correctly in §4.2 step 3.
- **EC-12** Payment gateway webhook/verify called twice (retry) → verify handler must be idempotent (check `paymentStatus !== "PAID"` before re-crediting/re-transitioning), same requirement as the existing standard checkout verify routes.

**Cart & checkout**
- **EC-13** Guest checkout (no account) for a pre-booking order → allowed; balance-due WhatsApp link needs a phone number, sourced from `shippingAddress.phone` already captured — no new requirement, but the balance-payment page (§5.2) must support lookup by `orderNumber` + phone (guest-safe), not just session.
- **EC-14** Customer adds a pre-booking item and a standard item to cart in the same session → cart page splits into two groups per §2.3; if they somehow submit both together via a stale client/API call, checkout API rejects (validation table, §6).
- **EC-15** Customer changes color variant on PDP from an out-of-stock (pre-bookable) color to an in-stock color after adding to cart → cart item must re-evaluate on next render, not cache the stale `isPreBooking` flag; cart store `CartItem` needs `isPreBooking: boolean` set at add-time and is safe to treat as a snapshot (matches how `stockQty` is already snapshotted into cart items today) — but re-validate server-side at checkout regardless (EC-3).
- **EC-16** `preBookingMaxQtyPerOrder` is lower than what's already in the customer's cart from a previous session (admin lowered it after they added items) → clamp at checkout, mirror the existing `Math.min(qty, stockQty)` clamp pattern already used in `lib/store/cart.ts`.

**Lifecycle & fulfillment**
- **EC-17** Admin over-commits (25 booked, can only make 20) discovered after the fact → no silent auto-cancellation; admin dashboard surfaces an "over-committed" warning (compare `preBookedQty` vs. a manually-entered "confirmed procurement capacity" note) for manual, case-by-case resolution — a data-integrity signal, not an automated action, since picking *which* 5 orders to cancel is a business judgment call.
- **EC-18** ETA slips past the promised date while still `IN_PROCUREMENT` → §4.6 sweep flags as "Overdue" on the admin dashboard (badge, matching the `overduePreBookings` sidebar count in §5.1); does not auto-notify the customer by default (avoid false alarms from admins who simply haven't updated status yet) — admin can trigger `update_eta` which *does* notify.
- **EC-19** Order contains multiple pre-booked line items (different colors/products) with different ETAs → order-level `preBookingEtaDate` is set to the **max** (latest) of the item-level product ETAs at booking time, since the whole order ships together (§2.1); admin can override.
- **EC-20** Review eligibility — a customer shouldn't be able to review a pre-booked product before delivery → existing review-eligibility check (keyed off order/item delivered state) needs no change since it already gates on delivery, not order type; just confirm it reads `Order.status === "DELIVERED"` which pre-booking orders reach normally once `FULFILLED → PROCESSING → SHIPPED → DELIVERED`.
- **EC-21** Returns for non-returnable pre-booked items — `Order.preBookingReturnsAllowedSnap` (snapshot, so a later admin policy change doesn't retroactively affect delivered orders) must be checked before the return-request UI/API accepts a request.

**Cross-cutting / reporting / mobile**
- **EC-22** Revenue reporting must distinguish "booked value" (full `totalAmount`, recognized as committed revenue) from "cash collected so far" (deposit vs. full) for finance's cash-flow visibility — see §8.2.3 KPI list; do not conflate the two in a single "Revenue" number.
- **EC-23** Tax invoice generation timing — generate/finalize the GST invoice when `paymentStatus` reaches fully `PAID` (i.e., at `FULFILLED` for deposit-policy orders, at booking for full-upfront), not at order creation, since the invoiced amount for a deposit order isn't final until the balance is paid.
- **EC-24** `getProducts({ inStock: true })` filter (used in "related products", search, category listings) — decide per call site whether `preBookingAvailable` items count as "in stock" for that filter; recommend **excluding** them from a strict `inStock` filter but **including** them in default/unfiltered listings with the Pre-Booking badge, and adding a distinct "Available to Pre-Book" filter chip on the shop page.
- **EC-25** Shiprocket/DTDC/Delhivery auto-booking (if any courier integration currently triggers on `status = CONFIRMED`) must be gated to only fire once `preBookingStatus = FULFILLED`, never at `REQUESTED`/`CONFIRMED` — audit the courier integration call sites during implementation to confirm where dispatch is currently triggered and add the guard.
- **EC-26** WhatsApp templates require **Meta pre-approval** before they can be sent — `prebooking_confirmation`, `prebooking_status_update`, `prebooking_eta_delayed`, `prebooking_ready_balance_due`, `prebooking_ready_no_balance`, `prebooking_cancelled_refund` all need to be submitted and approved in Meta Business Manager **before** this feature can notify customers — an operational dependency, not a code task, but a launch blocker. Track separately.
- **EC-27** Flutter app parity (BR-12) — every screen/state described in §8.1 needs an equivalent mobile screen; flag as explicit mobile scope, not an afterthought, since `api/v1` is the mobile app's only interface (confirmed no shared UI code between web and Flutter).
- **EC-28** Timezone — all ETA dates/timestamps should be interpreted and displayed in IST consistently (matches the business's single-market operation); store as UTC in Postgres per Prisma default, format with `en-IN`/`Asia/Kolkata` at the presentation layer, same as existing date formatting (`toLocaleDateString("en-IN", ...)` already used in `ProductDetailClient.tsx`).

---

## 8. UI/UX Design

A visual wireframe reference for the screens below (PDP pre-booking state, split cart, checkout consent block, order tracking stepper, admin product form section, admin pre-bookings list/detail) has been published separately as an interactive artifact — see the message accompanying this document.

### 8.1 Customer-facing

**PDP — `ProductDetailClient.tsx`, when `available <= 0` and `preBookingAvailable`**
Replaces the currently-empty buy-box (line 445 area) with:
- A gold-accent "Pre-Booking" badge (reuse `--color-badge-exclusive` / `--color-gold` tokens) next to the price, not a jarring red "Sold Out" — this is a sale, not a dead end.
- ETA line: *"Ships in 15–25 days"* or *"Expected by 12 Aug 2026"* (from `preBookingEtaLabel`).
- `preBookingDisclaimer` text in muted caption style under the ETA.
- Qty selector clamped to `min(preBookingMaxQtyPerOrder, preBookingRemainingSlots)`; if remaining slots = 0, swap the whole block for "Pre-Booking Slots Full" (no waitlist form in this scope — flagged as a Phase 2 idea in §14).
- CTA button reads "Pre-Book Now" (same visual weight/style as the existing "Add to Bag" `Button` component), not relabeled "Add to Bag" — must be unambiguous per BR-3.
- If `preBookingPaymentPolicy = PARTIAL_DEPOSIT`, show *"Pay ₹X now, ₹Y on dispatch"* under the price.
- Color swatches remain fully interactive — switching to an in-stock color reverts to the normal buy-box (per-variant evaluation, §2.2).

**Product card — `ProductCard.tsx`**
Tri-state badge instead of the current boolean `outOfStock`: `IN_STOCK` (no badge) / `PRE_BOOKABLE` ("Pre-Book" gold badge, still clickable/quick-add-able) / `SOLD_OUT` (existing "Sold Out" grey badge, disabled) — only true when *no* variant is in stock *and* `preBookingMode = OFF`.

**Cart page — `app/(marketing)/cart/page.tsx`**
Two visually distinct sections when both types are present: "Ready to Ship" and "Pre-Booked — Ships Separately" (with a one-line explainer why), each with its own subtotal and its own "Proceed to Checkout" button (§2.3). A single-type cart looks exactly as it does today — no UI change for the common case.

**Checkout page**
For a `PRE_BOOKING` checkout: an order-summary panel showing ETA, payment policy breakdown (deposit vs. balance, or full amount), returns-allowed note, and a **required** consent checkbox ("I understand this is a pre-booked item, expected in {eta}, and agree to the Pre-Booking Policy") gating the place-order button — validation rule in §6.

**Order confirmation & tracking — extends `OrderTimeline.tsx` / track-order page**
A distinct stepper for `PRE_BOOKING` orders: **Booked → Confirmed → In Procurement → Ready to Ship → [Balance Payment →] Shipped → Delivered**, replacing (not appending to) the standard 4-step stepper for these orders, with the current stage highlighted and `preBookingEtaDate` shown next to "Ready to Ship". A "Pay Balance" CTA appears inline at the `BALANCE_DUE` step.

### 8.2 Admin-facing

**Product form — new `SectionCard title="Pre-Booking"`**
Inserted after the existing "Product Details" section in `NewProductClient.tsx`/`EditProductClient.tsx`, using the exact existing `Toggle` component and form patterns already in that file:
- `Toggle` × radio-style mode selector: Off / Auto (when out of stock) / Always on — implemented as three `Toggle`-styled radio buttons or a segmented control matching the existing design tokens.
- Conditional fields (only rendered when mode ≠ Off): ETA min/max day inputs (or a date picker for a fixed expected date), max qty per order, max total capacity, payment policy select, deposit % (conditional on policy), disclaimer textarea, returns-allowed `Toggle`, free-cancel-hours input, cancel-fee-% input.
- Inline helper text under each field, matching the existing style (e.g. *"Shown in Product Details on the product page..."* pattern already used for Saree Length).

**Admin nav — `app/(admin)/admin/layout.tsx`**
New item under the existing "Inventory" group, alongside "Stock Update": `{ href: "/admin/pre-bookings", label: "Pre-Bookings", icon: PackageSearch (or similar), countKey: "pendingPreBookings", badgeVariant: "warning" }`. Overdue items get a second red-badge indicator (`overduePreBookings`) either on the same nav item or as a dashboard alert card.

**Admin Pre-Bookings list — `app/(admin)/admin/pre-bookings/page.tsx`**
Table: Order #, Customer, Product/Variant, Qty, Payment (policy + paid/pending amounts), Status badge (color-coded per `PreBookingStatus`, following the existing `STATUS_STYLES` record-map convention from `app/(admin)/admin/orders/page.tsx`), ETA (red text if overdue), Booked date. Filters: status, overdue-only, product, search. Row click → detail.

**Admin Pre-Booking detail**
Reuses the existing order-detail layout/components (customer info, address, items, payment) and adds a Pre-Booking panel: status stepper (mirrors the customer-facing one, admin-editable), action buttons per §4.4 (Confirm / Start Procurement / Update ETA / Mark Ready / Cancel / Unable to Fulfill), and an audit log rendered from the stage timestamp/actor columns (same pattern as the existing order timeline).

**Reports — extends existing admin Reports/Insights**
Pre-Booking KPI panel: total pre-bookings, conversion rate (booked → fulfilled), average fulfillment time (booking → shipped), overdue count, cash collected vs. committed revenue (EC-22), cancellation rate + reasons breakdown.

---

## 9. Notifications (WhatsApp, following `lib/whatsapp.ts` convention)

| Trigger | Template | Recipient |
|---|---|---|
| Payment verified, `REQUESTED → CONFIRMED` | `prebooking_confirmation` | Customer |
| `start_procurement` action | `prebooking_status_update` | Customer |
| `update_eta` action with a later date | `prebooking_eta_delayed` | Customer |
| `mark_ready` (deposit policy) | `prebooking_ready_balance_due` (includes payment link) | Customer |
| `mark_ready` (full-upfront policy) | `prebooking_ready_no_balance` | Customer |
| §4.6 sweep, `prebooking_balance_reminder_days` elapsed | `prebooking_status_update` (reminder variant) | Customer |
| `cancel` / `mark_unable_to_fulfill` / auto-cancel | `prebooking_cancelled_refund` | Customer |
| New `REQUESTED` order created | (optional) internal ops WhatsApp group notification | Admin/ops |

Each is a small helper mirroring `sendOrderConfirmationWhatsApp(order)` exactly: read `whatsapp_phone_id`/`whatsapp_token`/`whatsapp_api_url` from `SiteSetting`, resolve recipient phone from `order.userId` → `User.phone` or `shippingAddress.phone`, POST to the Graph API, fire-and-forget with `.catch(() => {})` from the calling route — no new notification infrastructure required. **Blocked on Meta template approval (EC-26).**

---

## 10. QA & Testing Strategy

Repo already has Vitest (unit) and Playwright (`e2e/`) configured — this plan extends both, no new tooling.

### 10.1 Unit tests (Vitest)

| ID | Target | Assertion |
|---|---|---|
| UT-1 | `preBookingAvailable` computation | Correct for all combinations of mode × stock × reserved |
| UT-2 | `preBookingEtaLabel` formatting | Range vs. fixed-date vs. unset renders correctly, IST |
| UT-3 | `reservePreBookingSlots` | Succeeds under capacity; throws `SLOTS_FULL` at/over cap; no-op guard when `cap == null` |
| UT-4 | Deposit/balance split math | Rounding to paise is consistent and `deposit + balance === totalAmount` for all `depositPercent` 1–99 |
| UT-5 | Cancel-fee computation | Correct for pre-window (0%), post-window (configured %), merchant-cancel (always 0%) |
| UT-6 | Admin action state-machine guard | Every invalid `From → action` combination rejected; every valid one allowed |

### 10.2 Integration/API tests

| ID | Scenario | Assertion |
|---|---|---|
| IT-1 | POST checkout with mixed cart payload | 400, clear error message |
| IT-2 | POST checkout with `cod` when disabled | 400 |
| IT-3 | Concurrent checkout at last slot (2 parallel requests) | Exactly one succeeds; loser gets `SLOTS_FULL`, not a crash or double-oversell — **the single most important test in this spec**, run with real concurrency (e.g. `Promise.all`), not sequential mocking |
| IT-4 | Verify webhook called twice (idempotency) | Second call is a no-op, no double slot-release or double status transition |
| IT-5 | Admin lowers cap below booked count | 400 with conflict count |
| IT-6 | `mark_ready` under `PARTIAL_DEPOSIT` | Balance gateway order created; status → `BALANCE_DUE`; WhatsApp helper invoked (mock) |
| IT-7 | Balance payment by guest via orderNumber+phone | Succeeds without session; fails with wrong phone |
| IT-8 | §4.6 sweep, balance overdue past grace | Auto-cancel, deposit refunded, slots released, template sent |
| IT-9 | Cancel after `IN_PROCUREMENT`, past free window | Refund = paid amount − fee%, `preBookedQty` decremented |
| IT-10 | `mark_unable_to_fulfill` after balance paid | Full refund of deposit + balance, no fee |
| IT-11 | Product edit disabling pre-booking with open orders | Open orders unaffected; new bookings blocked (EC-4) |
| IT-12 | Mobile (`api/v1`) checkout + verify + status read | Full parity with web response shape (BR-12) |

### 10.3 E2E (Playwright)

| ID | Flow |
|---|---|
| E2E-1 | Customer views OOS product with pre-booking enabled → sees Pre-Book CTA, not empty buy-box |
| E2E-2 | Full-upfront pre-booking: add to cart → checkout → consent checkbox required → pay → confirmation shows Pre-Booking stepper |
| E2E-3 | Deposit pre-booking: same, but checkout shows deposit/balance split; order confirmation shows "balance due later" |
| E2E-4 | Mixed cart: add one standard + one pre-booking item → cart shows two sections/two checkout buttons → each checks out independently |
| E2E-5 | Admin: enable pre-booking on a product via the new form section → storefront reflects it live |
| E2E-6 | Admin: walk an order through the full lifecycle (confirm → procurement → ready → balance paid → fulfilled) → customer-visible stepper updates at each stage |
| E2E-7 | Admin cancels a booking → refund flow + customer notification (mock WhatsApp) |
| E2E-8 | Slots-full state: set cap to 1, book it, second customer sees "Pre-Booking Slots Full" |

### 10.4 Security & abuse

- Balance-payment-by-orderNumber+phone endpoint (guest-safe, IT-7) must rate-limit and not leak whether an order number exists (generic error for both "not found" and "wrong phone") to prevent order-number enumeration.
- Admin action endpoints re-check `session.user.role === "ADMIN"` (existing pattern) on every action, not just the top-level route.
- Webhook/verify endpoints validate gateway signatures before any state mutation (existing pattern, must not regress for the new balance-payment verify routes).

### 10.5 Regression checklist (things this feature must NOT break)

- Standard (non-pre-booking) checkout, cart, and order flows are pixel- and behavior-identical when a product has `preBookingMode = OFF` (the default for all existing products).
- Existing `inStock` filter call sites (EC-24) behave as before unless explicitly updated.
- Existing return/cancel/refund flows for standard orders are untouched by the new `preBooking*` columns (all nullable/defaulted).

---

## 11. Non-Functional Requirements

- **Performance:** the atomic slot-reservation transaction (§4.1) adds one extra guarded write to the checkout critical path — acceptable, but must be load-tested under the IT-3 concurrency scenario at realistic traffic (a launch/restock spike is exactly when contention is highest).
- **Accessibility:** Pre-Booking badges must not rely on color alone (icon + text label), per the existing design system's use of `--color-badge-*` tokens alongside text.
- **i18n/currency:** single-market (INR/India) — no multi-currency requirement, consistent with the rest of the app.
- **Auditability:** every status transition is timestamp + actor logged (§3.4), matching the existing order/return audit pattern — required for handling customer disputes about "when was I told about the delay."
- **Mobile parity:** treated as a first-class requirement (BR-12, EC-27), not a follow-up phase.

---

## 12. Rollout, Migration & Feature Flag Plan

1. **Migration:** additive-only Prisma migration (§3.6), deployed first, with `prebooking_feature_enabled = false` in `SiteSetting` — zero customer-visible change.
2. **Internal QA:** run the full §10 suite against staging; walk one product through the entire admin lifecycle manually.
3. **Meta template approval (EC-26):** submit all WhatsApp templates for approval — this has external lead time, start in parallel with development, not after.
4. **Pilot:** flip `prebooking_feature_enabled = true`, enable pre-booking on 1–2 low-risk pilot products, monitor the admin Overdue/reports dashboard for a real booking-to-fulfillment cycle.
5. **General availability:** enable the toggle in the product form for all admins; no further flag needed since per-product `preBookingMode = OFF` is already the safe default — the global flag exists purely to hide the admin UI/storefront code paths during pilot, not to gate individual products.
6. **Rollback:** setting `prebooking_feature_enabled = false` hides new-booking UI immediately; any already-open pre-booking orders continue through their lifecycle via the admin panel regardless (never strand an order mid-procurement because of a flag flip).

---

## 13. Open Decisions Requiring Stakeholder Sign-off

| # | Decision | Recommendation |
|---|---|---|
| 1 | Per-variant (color) pre-booking override vs. product-level only (§2.2) | Ship product-level only for v1; revisit if a real multi-color-mixed-stock scenario shows up in usage data |
| 2 | Default deposit % and cancellation fee % | 30–50% deposit, 0% cancel fee at launch (build trust first), tune later from EC-17/EC-22 reporting |
| 3 | Should pre-booking be allowed on already-in-stock products (`ALWAYS_ON` for "coming soon" collections) | Recommend yes — BR-1 already includes this mode, but confirm it's wanted for launch v1 or deferred |
| 4 | Waitlist/"Notify Me" when slots are full | Out of scope for v1 (§8.1 note); worth a fast-follow given low implementation cost once the capacity model exists |
| 5 | Returns-allowed default (`preBookingReturnsAllowed`) | Default `true` (matches standard product default) but expect most made-to-order sarees will be set to `false` per-product |
| 6 | Cron/scheduling mechanism for §4.6 (Vercel Cron vs. external) | Depends on current hosting — confirm with DevOps before implementation starts |

---

## Appendix: Glossary

- **Slot / capacity** — a unit of `preBookingMaxTotalQty`, tracked via `ProductVariant.preBookedQty`.
- **Deposit** — the upfront charge under `PARTIAL_DEPOSIT` policy; **balance** — the remainder, collected at `READY_TO_SHIP`.
- **Free-cancel window** — `preBookingFreeCancelHours` after booking, during which customer self-cancellation is fee-free.
- **Fulfilled** — the point a pre-booking order rejoins the standard `OrderStatus` pipeline (eligible for `PROCESSING`/`SHIPPED`/`DELIVERED`).
