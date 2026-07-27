"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check, ChevronRight, MapPin, CreditCard, ClipboardList,
  Truck, ShieldCheck, ArrowRight, Plus, X, Wallet, Info, Pencil,
} from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import { useCartStore, useCheckoutMetaStore } from "@/lib/store/cart";
import { CouponPicker } from "@/components/cart/CouponPicker";
import { formatINR } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { SearchableSelect, COUNTRY_NAMES } from "@/components/ui/SearchableSelect";
import { SmartImage } from "@/components/ui/SmartImage";

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { label: "Delivery", icon: MapPin },
  { label: "Payment",  icon: CreditCard },
  { label: "Review",   icon: ClipboardList },
] as const;
type Step = 0 | 1 | 2;

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh",
  "Puducherry","Chandigarh",
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddressForm {
  fullName: string; phone: string;
  addressLine1: string; addressLine2: string;
  city: string; state: string; pincode: string; country: string;
}

interface SavedAddress extends AddressForm {
  id: string;
  isDefault: boolean;
}

const emptyAddress: AddressForm = {
  fullName: "", phone: "", addressLine1: "", addressLine2: "",
  city: "", state: "", pincode: "", country: "India",
};

// ─── Form fields ──────────────────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, error, type = "text", disabled }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; error?: string; type?: string; disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} disabled={disabled}
        className="w-full h-11 px-4 border rounded-md text-sm focus:outline-none transition-all"
        style={{ borderColor: error ? "var(--color-error)" : "var(--color-parchment)", background: "white", color: "var(--color-text-primary)", fontFamily: "var(--font-body)", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary-50)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = error ? "var(--color-error)" : "var(--color-parchment)"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04)"; }}
      />
      {error && <p className="text-xs font-medium" style={{ color: "var(--color-error)" }}>{error}</p>}
    </div>
  );
}


// ─── OTP boxes ────────────────────────────────────────────────────────────────

function OtpBoxes({ value, onChange, idPrefix }: { value: string; onChange: (v: string) => void; idPrefix: string }) {
  return (
    <div className="flex gap-1.5 sm:gap-2 justify-center">
      {Array.from({ length: 4 }).map((_, i) => (
        <input
          key={i} id={`${idPrefix}-${i}`} type="text" inputMode="numeric" maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => {
            const ch = e.target.value.replace(/\D/g, "").slice(-1);
            const arr = value.split(""); arr[i] = ch;
            onChange(arr.join("").slice(0, 4));
            if (ch && i < 3) document.getElementById(`${idPrefix}-${i + 1}`)?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !value[i] && i > 0) {
              document.getElementById(`${idPrefix}-${i - 1}`)?.focus();
              const arr = value.split(""); arr[i - 1] = ""; onChange(arr.join(""));
            }
          }}
          className="w-9 h-12 sm:w-11 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-lg border-2 focus:outline-none transition-all"
          style={{ borderColor: value[i] ? "var(--color-primary)" : "var(--color-parchment)", background: "white", color: "var(--color-text-primary)" }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary-50)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = value[i] ? "var(--color-primary)" : "var(--color-parchment)"; e.currentTarget.style.boxShadow = "none"; }}
        />
      ))}
    </div>
  );
}

// ─── Phone Verify Modal (guest checkout step) ─────────────────────────────────

function PhoneVerifyModal({ phone, onVerified, onClose }: {
  phone: string; onVerified: () => void; onClose: () => void;
}) {
  const [otp, setOtp]             = useState("");
  const [loading, setLoading]     = useState(false);
  const [sending, setSending]     = useState(true);
  const [error, setError]         = useState("");
  const [devOtp, setDevOtp]       = useState("");
  const [countdown, setCountdown] = useState(0);

  const startCountdown = () => {
    setCountdown(30);
    const t = setInterval(() => setCountdown((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  };

  const sendOtp = async () => {
    setError(""); setSending(true);
    try {
      const res  = await fetch("/api/auth/otp/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to send OTP"); return; }
      startCountdown();
      if (data.otp) setDevOtp(data.otp);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => { sendOtp(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const verify = async () => {
    if (otp.length < 4) { setError("Enter the 4-digit OTP"); return; }
    setError(""); setLoading(true);
    try {
      // signIn creates account if phone is new, or logs in existing user — silent either way
      const result = await signIn("phone-otp", { phone, otp, redirect: false });
      if (result?.error) {
        setError("Invalid or expired OTP. Please try again.");
        setOtp("");
      } else {
        onVerified();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden" style={{ background: "var(--color-ivory)" }}>
        <div className="px-7 pt-7 pb-5 border-b flex items-start justify-between" style={{ borderColor: "var(--color-parchment)" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.4rem", color: "var(--color-text-primary)" }}>
              Verify Your Mobile
            </h2>
            <p className="text-sm font-body mt-1" style={{ color: "var(--color-text-muted)" }}>
              {sending ? "Sending OTP…" : `OTP sent to +91 ${phone}`}
            </p>
          </div>
          <button onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-cream transition-colors ml-4 shrink-0"
            style={{ color: "var(--color-text-muted)" }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-7 space-y-5">
          {error && (
            <div className="px-4 py-3 rounded-lg text-sm font-body"
              style={{ background: "var(--color-error-bg)", color: "var(--color-error)", border: "1px solid var(--color-error)" }}>
              {error}
            </div>
          )}
          {devOtp && (
            <div className="px-3 py-2 rounded-lg text-xs font-body text-center"
              style={{ background: "#FEF9C3", color: "#92400E", border: "1px solid #FDE68A" }}>
              Dev mode — OTP: <strong>{devOtp}</strong>
            </div>
          )}

          <OtpBoxes value={otp} onChange={setOtp} idPrefix="verify-otp" />

          <button
            onClick={verify}
            disabled={loading || otp.length < 4 || sending}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-lg text-sm font-semibold font-body transition-all disabled:opacity-50"
            style={{ background: "var(--color-primary)", color: "white" }}
          >
            {loading
              ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : "Verify & Continue to Payment"}
          </button>

          <div className="text-center text-sm font-body">
            {countdown > 0
              ? <span style={{ color: "var(--color-text-muted)" }}>Resend in {countdown}s</span>
              : <button onClick={sendOtp} disabled={sending} className="font-medium hover:underline" style={{ color: "var(--color-primary)" }}>
                  Resend OTP
                </button>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Address form fields ──────────────────────────────────────────────────────

function AddressFormFields({ address, onChange, errors, isInternational }: {
  address: AddressForm;
  onChange: (field: keyof AddressForm) => (v: string) => void;
  errors: Partial<AddressForm>;
  isInternational: boolean;
}) {
  const countryOptions = isInternational
    ? COUNTRY_NAMES.filter((c) => c !== "India")
    : ["India"];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Full Name *" value={address.fullName} onChange={onChange("fullName")} error={errors.fullName} placeholder="Priya Sharma" />
      <Field label="Mobile Number *" value={address.phone} onChange={(v) => onChange("phone")(v.replace(/\D/g, "").slice(0, 10))} error={errors.phone} placeholder="10-digit number" type="tel" />
      <div className="md:col-span-2 min-w-0">
        <Field label="Address Line 1 *" value={address.addressLine1} onChange={onChange("addressLine1")} error={errors.addressLine1} placeholder="House / Flat / Block No., Street" />
      </div>
      <div className="md:col-span-2 min-w-0">
        <Field label="Address Line 2" value={address.addressLine2} onChange={onChange("addressLine2")} placeholder="Locality / Landmark (optional)" />
      </div>
      <Field label="City *" value={address.city} onChange={onChange("city")} error={errors.city} placeholder="Mumbai" />
      <div className="space-y-1.5 min-w-0">
        <label className="block text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>State *</label>
        <input
          type="text"
          list="checkout-states-datalist"
          value={address.state}
          onChange={(e) => onChange("state")(e.target.value)}
          placeholder="e.g. Tamil Nadu"
          className="w-full h-11 px-4 border rounded-md text-sm focus:outline-none transition-all"
          style={{ borderColor: errors.state ? "var(--color-error)" : "var(--color-parchment)", background: "white", color: "var(--color-text-primary)", fontFamily: "var(--font-body)", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary-50)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = errors.state ? "var(--color-error)" : "var(--color-parchment)"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04)"; }}
        />
        <datalist id="checkout-states-datalist">
          {INDIAN_STATES.map((s) => <option key={s} value={s} />)}
        </datalist>
        {errors.state && <p className="text-xs font-medium" style={{ color: "var(--color-error)" }}>{errors.state}</p>}
      </div>
      <Field label="Pincode *" value={address.pincode} onChange={(v) => onChange("pincode")(v.replace(/\D/g, "").slice(0, 6))} error={errors.pincode} placeholder="400001" />
      <div className="md:col-span-2 min-w-0">
        <SearchableSelect
          label="Country"
          value={address.country}
          onChange={onChange("country")}
          options={countryOptions}
          placeholder="Select Country"
          disabled={!isInternational}
        />
      </div>
    </div>
  );
}

// ─── Saved address card ───────────────────────────────────────────────────────

function AddressCard({ addr, selected, onSelect, onEdit }: { addr: SavedAddress; selected: boolean; onSelect: () => void; onEdit: () => void }) {
  return (
    <label
      className="flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all relative"
      style={{ borderColor: selected ? "var(--color-primary)" : "var(--color-parchment)", background: selected ? "var(--color-primary-50)" : "white" }}
    >
      <input type="radio" className="mt-0.5 accent-primary" checked={selected} onChange={onSelect} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold font-body flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
          {addr.fullName}
          {addr.isDefault && (
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide"
              style={{ background: "var(--color-primary)", color: "white" }}>Default</span>
          )}
        </p>
        <p className="text-sm font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          {addr.addressLine1}{addr.addressLine2 ? ", " + addr.addressLine2 : ""}, {addr.city}, {addr.state} — {addr.pincode}
        </p>
        <p className="text-xs font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>{addr.phone}</p>
      </div>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }}
        className="shrink-0 inline-flex items-center gap-1 text-xs font-body font-medium transition-colors hover:opacity-80"
        style={{ color: "var(--color-primary)" }}
        aria-label="Edit address"
      >
        <Pencil className="h-3.5 w-3.5" /> Edit
      </button>
    </label>
  );
}

// ─── Main checkout page ───────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { items: allItems, removeItems } = useCartStore();
  const {
    coupon, setCoupon, removeCoupon: removeCouponFromStore,
    clearCheckoutMeta,
  } = useCheckoutMetaStore();
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep]                       = useState<Step>(0);
  const [address, setAddress]                 = useState<AddressForm>(emptyAddress);
  const [errors, setErrors]                   = useState<Partial<AddressForm>>({});
  const [showPhoneVerify, setShowPhoneVerify] = useState(false);

  // Pre-Booking — a mixed cart never checks out as one order (see
  // PRE_BOOKING_PLAN.md §2.3), so this page only ever operates on the slice
  // of the cart matching ?type=. Same page, same steps, filtered items.
  const bookingType: "standard" | "prebooking" = searchParams.get("type") === "prebooking" ? "prebooking" : "standard";
  const isPreBooking = bookingType === "prebooking";
  const items = allItems.filter((i) => (isPreBooking ? !!i.isPreBooking : !i.isPreBooking));
  const [preBookingConsent, setPreBookingConsent] = useState(false);
  const preBookingEtaLabel = items.find((i) => i.preBookingEtaLabel)?.preBookingEtaLabel ?? null;

  // Logged-in: saved addresses
  const [savedAddresses, setSavedAddresses]       = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new" | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [savingAddress, setSavingAddress]         = useState(false);
  const [editingAddressId, setEditingAddressId]   = useState<string | null>(null);

  // Shipping config (per-saree model)
  const [shippingConfig, setShippingConfig] = useState({
    freeShippingThreshold: 2999, firstSareeRate: 100, additionalSareeRate: 50,
    deliveryTitle: "Standard Delivery", deliveryNotes: "4–7 business days",
    internationalShippingNote: "",
  });
  const [showSummaryIntlNote, setShowSummaryIntlNote] = useState(false);
  useEffect(() => {
    fetch("/api/shipping-config").then(r => r.json()).then(d => setShippingConfig(d)).catch(() => {});
  }, []);

  // Wallet
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet]         = useState(false);

  // Payment
  const [payment, setPayment] = useState<"cod" | "cashfree" | "icici" | "icici-pg" | "netbanking" | "">("");
  const [placing, setPlacing] = useState(false);
  const [ordered, setOrdered]         = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState("");
  const [paymentCfg, setPaymentCfg]   = useState({ razorpay: false, cashfree: false, icici: false, iciciPg: false, cod: false });
  const [paymentCfgLoaded, setPaymentCfgLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/payment-config", { cache: "no-store" }).then(r => r.json()).then(d => {
      setPaymentCfg(d);
      if (isPreBooking) {
        // Pre-booking is Razorpay-only for now — never fall back to another gateway or COD.
        setPayment(d.razorpay ? "netbanking" : "");
      } else if (d.razorpay) setPayment("netbanking");
      else if (d.cashfree) setPayment("cashfree");
      else if (d.iciciPg) setPayment("icici-pg");
      else if (d.icici) setPayment("icici");
      else if (d.cod) setPayment("cod");
      else setPayment("");
      setPaymentCfgLoaded(true);
    }).catch(() => { setPaymentCfgLoaded(true); });
  }, [isPreBooking]);


  // International shipping — derived from ?intl=1 URL param set by cart page
  const effectiveIntl = searchParams.get("intl") === "1";

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/user/wallet").then(r => r.json()).then(d => {
      setWalletBalance(Number(d.balance ?? 0));
    }).catch(() => {});
  }, [status]);

  const sub      = items.reduce((s, i) => s + i.salePrice * i.quantity, 0);
  const discount = isPreBooking ? 0 : (coupon?.discount ?? 0);
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const gstAmount = items.reduce((s, i) => {
    const rate = i.gstPercent ?? 5;
    const lineTotal = i.salePrice * i.quantity;
    return s + (lineTotal - lineTotal / (1 + rate / 100));
  }, 0);

  const shippingCost = (() => {
    if (effectiveIntl) return 0; // International: no charge at checkout
    if (coupon?.freeShipping) return 0;
    if (sub >= shippingConfig.freeShippingThreshold) return 0;
    return shippingConfig.firstSareeRate + Math.max(0, totalQty - 1) * shippingConfig.additionalSareeRate;
  })();

  const total          = Math.max(0, sub + shippingCost - discount);
  const walletDeduction = useWallet ? Math.min(walletBalance, total) : 0;
  const finalTotal      = Math.max(0, total - walletDeduction);

  const removeCoupon = () => removeCouponFromStore();

  // Fetch saved addresses once session is available
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/user/addresses")
      .then((r) => r.json())
      .then(({ addresses }) => {
        const list: SavedAddress[] = addresses ?? [];
        setSavedAddresses(list);

        // Only auto-select an address whose country is compatible with the shipping mode
        const compatible = (a: SavedAddress) =>
          effectiveIntl ? a.country !== "India" : a.country === "India";

        const suitable =
          list.find((a) => a.isDefault && compatible(a)) ??
          list.find((a) => compatible(a));

        setSelectedAddressId(suitable?.id ?? "new");
      })
      .catch(() => {});
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const addr = (field: keyof AddressForm) => (v: string) => setAddress((a) => ({ ...a, [field]: v }));

  // Sync country with shipping mode
  useEffect(() => {
    if (!effectiveIntl) {
      setAddress((a) => ({ ...a, country: "India" }));
    } else if (address.country === "India") {
      setAddress((a) => ({ ...a, country: "" }));
    }
  }, [effectiveIntl]); // eslint-disable-line react-hooks/exhaustive-deps

  const validate = (a: AddressForm): boolean => {
    const e: Partial<AddressForm> = {};
    if (!a.fullName.trim())  e.fullName     = "Required";
    if (!a.phone.trim() || a.phone.length < 10) e.phone = "Valid 10-digit number required";
    if (!a.addressLine1.trim()) e.addressLine1 = "Required";
    if (!a.city.trim())      e.city         = "Required";
    if (!a.state)            e.state        = "Required";
    if (!a.pincode.trim() || a.pincode.length !== 6) e.pincode = "Valid 6-digit pincode required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const getActiveAddress = (): AddressForm | null => {
    if (session) {
      if (showNewAddressForm || selectedAddressId === "new") return address;
      return savedAddresses.find((a) => a.id === selectedAddressId) ?? null;
    }
    return address;
  };

  const handleContinueDelivery = async () => {
    if (session) {
      // Logged-in: optionally save a new address (or update existing one) then proceed
      if (showNewAddressForm || selectedAddressId === "new") {
        if (!validate(address)) return;
        setSavingAddress(true);
        try {
          const isEdit = !!editingAddressId;
          const res  = await fetch(
            isEdit ? `/api/user/addresses/${editingAddressId}` : "/api/user/addresses",
            {
              method: isEdit ? "PATCH" : "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(
                isEdit ? address : { ...address, isDefault: savedAddresses.length === 0 },
              ),
            },
          );
          const data = await res.json();
          if (res.ok) {
            setSavedAddresses((prev) =>
              isEdit
                ? prev.map((a) => (a.id === data.address.id ? data.address : a))
                : [...prev, data.address],
            );
            setSelectedAddressId(data.address.id);
            setShowNewAddressForm(false);
            setEditingAddressId(null);
            setAddress(emptyAddress);
          }
        } catch {}
        setSavingAddress(false);
      }
      setStep(1);
    } else {
      // Guest: validate address, then trigger phone verify
      if (!validate(address)) return;
      setShowPhoneVerify(true);
    }
  };

  const onGuestVerified = async () => {
    // Account is created or found silently — just refresh session and proceed
    await updateSession();
    setShowPhoneVerify(false);
    setStep(1);
  };

  const placeOrder = async () => {
    if (!payment) return;
    if (isPreBooking && payment !== "netbanking") return; // defense-in-depth — UI never offers other methods
    if (isPreBooking && !preBookingConsent) return;
    setPlacing(true);
    try {
      const orderPayload = {
        address:        activeAddress,
        paymentMethod:  payment,
        shippingAmount: shippingCost,
        discountAmount: discount,
        couponCode:     coupon?.code ?? null,
        walletAmount:   walletDeduction,
        items,
      };

      // ── Cashfree gateway flow ──────────────────────────────────────
      if (payment === "cashfree") {
        const res = await fetch("/api/web/checkout/cashfree", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderPayload),
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.error || "Payment setup failed. Please try again.");
          setPlacing(false);
          return;
        }

        // Load Cashfree JS SDK
        await new Promise<void>((resolve, reject) => {
          if ((window as any).Cashfree) { resolve(); return; }
          const s = document.createElement("script");
          s.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Failed to load Cashfree SDK"));
          document.head.appendChild(s);
        });

        removeItems(items.map((i) => i.variantId));
        clearCheckoutMeta();

        const cashfree = (window as any).Cashfree({
          mode: data.testMode ? "sandbox" : "production",
        });

        // _modal opens Cashfree as a lightbox iframe overlay on the same page,
        // same behavior as Razorpay's popup. Must be triggered directly from
        // the user's click handler so the browser doesn't treat it as a popup.
        cashfree.checkout({
          paymentSessionId: data.paymentSessionId,
          redirectTarget: "_modal",
        }).then((result: any) => {
          if (result?.paymentDetails) {
            setPlacedOrderNumber(data.orderNumber);
            setOrdered(true);
            router.refresh();
          } else {
            window.location.href = `/checkout/cashfree-return?order=${data.orderNumber}`;
          }
        }).catch(() => {
          window.location.href = `/checkout/cashfree-return?order=${data.orderNumber}`;
        });
        return;
      }

      // ── Razorpay modal (Net Banking) ──────────────────────────────
      if (payment === "netbanking") {
        const checkoutPath = isPreBooking ? "/api/web/checkout/pre-booking/razorpay" : "/api/web/checkout/razorpay";
        const verifyPath   = isPreBooking ? "/api/web/checkout/pre-booking/razorpay/verify" : "/api/web/checkout/razorpay/verify";

        const res = await fetch(checkoutPath, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderPayload),
        });
        const data = await res.json();
        if (!res.ok) {
          if (isPreBooking) alert(data.error || "Could not start pre-booking checkout. Please try again.");
          setPlacing(false); return;
        }

        // Load Razorpay script
        await new Promise<void>((resolve, reject) => {
          if ((window as any).Razorpay) { resolve(); return; }
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => resolve();
          s.onerror = reject;
          document.head.appendChild(s);
        });

        const rzp = new (window as any).Razorpay({
          key:         data.keyId,
          amount:      data.amount,
          currency:    "INR",
          name:        "Vijaylakshmi Sarees",
          order_id:    data.razorpayOrderId,
          prefill:     { name: data.customerName, contact: data.customerPhone },
          method:      "netbanking",
          handler: async (resp: any) => {
            const v = await fetch(verifyPath, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId:           data.orderId,
                razorpayOrderId:   resp.razorpay_order_id,
                razorpayPaymentId: resp.razorpay_payment_id,
                razorpaySignature: resp.razorpay_signature,
              }),
            });
            const vData = await v.json();
            if (vData.success) {
              removeItems(items.map((i) => i.variantId)); clearCheckoutMeta();
              setPlacedOrderNumber(vData.orderNumber);
              setOrdered(true); router.refresh();
            }
          },
          modal: { ondismiss: () => setPlacing(false) },
        });
        rzp.open();
        return;
      }

      // ── ICICI Eazypay (popup window) ─────────────────────────────
      if (payment === "icici") {
        const res = await fetch("/api/web/checkout/icici", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderPayload),
        });
        const data = await res.json();
        if (!res.ok) { setPlacing(false); return; }

        // Open popup window for ICICI payment
        const popup = window.open("", "icici_payment", "width=700,height=750,scrollbars=yes,resizable=yes");

        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.paymentUrl;
        form.target = popup ? "icici_payment" : "_self";
        [["encRequest", data.encRequest], ["access_code", data.accessCode]].forEach(([name, value]) => {
          const inp = document.createElement("input");
          inp.type = "hidden"; inp.name = name; inp.value = value;
          form.appendChild(inp);
        });
        document.body.appendChild(form);
        form.submit();
        form.remove();

        if (!popup) return; // popup blocked — form submitted to _self (navigates away)

        removeItems(items.map((i) => i.variantId)); clearCheckoutMeta();

        // Listen for popup to post result back
        const handleMsg = (e: MessageEvent) => {
          if (e.origin !== window.location.origin) return;
          if (e.data?.type !== "icici_payment_complete") return;
          window.removeEventListener("message", handleMsg);
          clearInterval(pollTimer);
          if (e.data.status === "success") {
            setPlacedOrderNumber(e.data.orderNumber || data.orderNumber);
            setOrdered(true);
            router.refresh();
          } else {
            setPlacing(false);
          }
        };
        window.addEventListener("message", handleMsg);

        // Fallback: if user closes popup without completing
        const pollTimer = setInterval(() => {
          if (popup.closed) {
            clearInterval(pollTimer);
            window.removeEventListener("message", handleMsg);
            setPlacing(false);
          }
        }, 600);
        return;
      }

      // ── ICICI PG Direct — UPI, Cards, Net Banking (hosted redirect) ─
      if (payment === "icici-pg") {
        const res = await fetch("/api/web/checkout/icici-pg", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderPayload),
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.error || "Payment setup failed. Please try again.");
          setPlacing(false);
          return;
        }
        removeItems(items.map((i) => i.variantId)); clearCheckoutMeta();
        window.location.href = data.redirectUrl;
        return;
      }

      // ── COD ───────────────────────────────────────────────────────
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
      const data = await res.json();
      if (!res.ok) { setPlacing(false); return; }
      removeItems(items.map((i) => i.variantId));
      clearCheckoutMeta();
      setPlacedOrderNumber(data.order.orderNumber);
      setOrdered(true);
      router.refresh();
    } catch {
      setPlacing(false);
    }
  };

  // ── Empty cart ──────────────────────────────────────────────────────────────
  if (items.length === 0 && !ordered) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-ivory)" }}>
        <div className="text-center space-y-4">
          <p style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-h2)", color: "var(--color-text-primary)" }}>
            {isPreBooking ? "No pre-booked items in your cart" : "Your cart is empty"}
          </p>
          <Button asChild><Link href="/cart">Back to Cart</Link></Button>
        </div>
      </div>
    );
  }

  // ── Order success ───────────────────────────────────────────────────────────
  if (ordered) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center py-10 sm:py-16 px-4" style={{ background: "var(--color-ivory)" }}>
        {/* Animated success icon */}
        <div className="relative mb-5 sm:mb-7">
          {/* Outer pulse rings */}
          <span className="absolute inset-0 rounded-full animate-ping-slow" style={{ background: "var(--color-success)", opacity: 0.18 }} />
          <span className="absolute -inset-2 rounded-full animate-ping-slow-2" style={{ background: "var(--color-success)", opacity: 0.10 }} />
          {/* Main badge */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center animate-bounce-in shadow-lg"
            style={{ background: "var(--color-success)", boxShadow: "0 10px 30px -8px rgba(46,107,71,0.45)" }}>
            <Check className="h-10 w-10 sm:h-12 sm:w-12 text-white animate-check-pop" strokeWidth={3} />
          </div>
        </div>

        <p className="text-xs font-body font-semibold uppercase tracking-[0.18em] mb-1.5 animate-fade-up" style={{ color: isPreBooking ? "var(--color-gold-dark)" : "var(--color-success)", animationDelay: "0.15s" }}>
          {isPreBooking ? "Pre-Booked" : "Confirmed"}
        </p>
        <h2 className="mb-2 animate-fade-up" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.6rem, 5vw, 2.5rem)", color: "var(--color-text-primary)", animationDelay: "0.2s" }}>
          {isPreBooking ? "Your Pre-Booking is Confirmed!" : "Thank You for Your Order!"}
        </h2>
        {placedOrderNumber && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3 animate-fade-up"
            style={{ background: "white", border: "1px solid var(--color-parchment)", animationDelay: "0.3s" }}>
            <span className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>Order ID:</span>
            <span className="text-sm font-mono font-semibold" style={{ color: "var(--color-primary)" }}>#{placedOrderNumber}</span>
          </div>
        )}
        <p className="text-sm font-body mb-2 max-w-md animate-fade-up" style={{ color: "var(--color-text-muted)", animationDelay: "0.35s" }}>
          {isPreBooking
            ? <>We'll begin procuring your item and keep you updated. {preBookingEtaLabel ? <><span className="font-semibold" style={{ color: "var(--color-text-secondary)" }}>{preBookingEtaLabel}</span>.</> : null}</>
            : <>We've received your order and will email you once it ships. Estimated delivery: <span className="font-semibold" style={{ color: "var(--color-text-secondary)" }}>4–7 business days</span>.</>}
        </p>
        <p className="text-sm font-body mb-7 max-w-md animate-fade-up" style={{ color: "var(--color-text-muted)", animationDelay: "0.4s" }}>
          From our family of weavers to your home — thank you for choosing Vijaylakshmi Sarees.
        </p>

        <div className="flex gap-3 flex-wrap justify-center w-full max-w-md animate-fade-up" style={{ animationDelay: "0.45s" }}>
          <Button onClick={() => { router.refresh(); router.push("/account/orders"); }} className="flex-1 min-w-[140px]">
            View My Orders
          </Button>
          <Button variant="outline" asChild className="flex-1 min-w-[140px]"><Link href="/shop">Continue Shopping</Link></Button>
        </div>
      </div>
    );
  }

  // ── Session still loading — show skeleton shell ─────────────────────────────
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-ivory)" }}>
        <span className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const activeAddress = getActiveAddress();

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ivory)" }}>

      {/* Guest phone verify modal — part of delivery flow, not an interruption */}
      {showPhoneVerify && (
        <PhoneVerifyModal
          phone={address.phone}
          onVerified={onGuestVerified}
          onClose={() => setShowPhoneVerify(false)}
        />
      )}

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-10">

        {/* Step progress */}
        <div className="flex items-center justify-center mb-10">
          {STEPS.map(({ label }, i) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all"
                  style={{
                    background: i < step ? "var(--color-success)" : i === step ? "var(--color-primary)" : "var(--color-cream)",
                    color: i <= step ? "white" : "var(--color-text-muted)",
                    border: i <= step ? "none" : "1.5px solid var(--color-parchment)",
                  }}>
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className="text-[11px] font-medium font-body"
                  style={{ color: i === step ? "var(--color-primary)" : "var(--color-text-muted)" }}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-10 sm:w-28 h-0.5 mx-2 sm:mx-3 mb-5 transition-all"
                  style={{ background: i < step ? "var(--color-success)" : "var(--color-parchment)" }} />
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:items-start">
          <div className="w-full flex-1 min-w-0 order-2 lg:order-1">

            {/* ── STEP 0: Delivery ──────────────────────────────────────────── */}
            {step === 0 && (
              <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
                <div className="px-6 py-5 border-b flex items-center gap-2.5" style={{ borderColor: "var(--color-parchment)", background: "var(--color-cream)" }}>
                  <MapPin className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
                  <h2 className="text-base font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>Delivery Address</h2>
                </div>

                <div className="p-6 space-y-5">
                  {(() => {
                    const compatibleAddresses = savedAddresses.filter((a) =>
                      effectiveIntl ? a.country !== "India" : a.country === "India"
                    );
                    const hasIncompatible = savedAddresses.length > 0 && compatibleAddresses.length === 0;
                    const showSaved = session && compatibleAddresses.length > 0;

                    return (
                      <>
                        {/* Notice when user has addresses but none match shipping mode */}
                        {session && hasIncompatible && (
                          <div className="flex items-start gap-3 p-3.5 rounded-lg border text-sm font-body"
                            style={{ background: "#FFFBEB", borderColor: "#FCD34D", color: "#92400E" }}>
                            <MapPin className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#D97706" }} />
                            <p>
                              {effectiveIntl
                                ? "Your saved addresses are for India only. Please add an international shipping address."
                                : "Your saved addresses are for international shipping. Please add an India address for domestic delivery."}
                            </p>
                          </div>
                        )}

                        {/* Logged-in with compatible saved addresses */}
                        {showSaved && (
                          <div className="space-y-3">
                            {compatibleAddresses.map((a) => (
                              <AddressCard
                                key={a.id} addr={a}
                                selected={selectedAddressId === a.id && !showNewAddressForm}
                                onSelect={() => { setSelectedAddressId(a.id); setShowNewAddressForm(false); setEditingAddressId(null); }}
                                onEdit={() => {
                                  setEditingAddressId(a.id);
                                  setSelectedAddressId("new");
                                  setShowNewAddressForm(true);
                                  setAddress({
                                    fullName: a.fullName,
                                    phone: a.phone,
                                    addressLine1: a.addressLine1,
                                    addressLine2: a.addressLine2 || "",
                                    city: a.city,
                                    state: a.state,
                                    pincode: a.pincode,
                                    country: a.country || "India",
                                  });
                                  setErrors({});
                                }}
                              />
                            ))}

                            <button
                              onClick={() => {
                                if (showNewAddressForm) {
                                  setShowNewAddressForm(false);
                                  setEditingAddressId(null);
                                  setAddress(emptyAddress);
                                  setErrors({});
                                  if (compatibleAddresses[0]) setSelectedAddressId(compatibleAddresses[0].id);
                                } else {
                                  setShowNewAddressForm(true);
                                  setSelectedAddressId("new");
                                  setEditingAddressId(null);
                                  setAddress(emptyAddress);
                                  setErrors({});
                                }
                              }}
                              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed text-sm font-body font-medium transition-colors hover:bg-cream"
                              style={{
                                borderColor: showNewAddressForm ? "var(--color-primary)" : "var(--color-parchment)",
                                color:       showNewAddressForm ? "var(--color-primary)" : "var(--color-text-muted)",
                              }}
                            >
                              <Plus className="h-4 w-4" /> Add New Address
                            </button>

                            {showNewAddressForm && (
                              <div className="pt-2 space-y-3">
                                {editingAddressId && (
                                  <p className="text-xs font-body font-medium" style={{ color: "var(--color-primary)" }}>
                                    Editing saved address — changes will update it.
                                  </p>
                                )}
                                <AddressFormFields address={address} onChange={addr} errors={errors} isInternational={effectiveIntl} />
                              </div>
                            )}
                          </div>
                        )}

                        {/* No compatible saved addresses, or guest — show form directly */}
                        {(!session || savedAddresses.length === 0 || hasIncompatible) && (
                          <AddressFormFields address={address} onChange={addr} errors={errors} isInternational={effectiveIntl} />
                        )}
                      </>
                    );
                  })()}

                  {/* Shipping — read-only summary from cart selection */}
                  <div className="rounded-lg border p-4 flex items-center justify-between gap-4"
                    style={{ borderColor: "var(--color-parchment)", background: "var(--color-primary-50)" }}>
                    <div className="flex items-center gap-2.5">
                      <Truck className="h-4 w-4 shrink-0" style={{ color: "var(--color-primary)" }} />
                      <div>
                        <p className="text-sm font-medium font-body" style={{ color: "var(--color-text-primary)" }}>
                          {effectiveIntl ? "International Shipping" : shippingConfig.deliveryTitle}
                        </p>
                        <p className="text-xs font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                          {effectiveIntl ? "Charges communicated separately" : shippingConfig.deliveryNotes}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-semibold font-body" style={{ color: "var(--color-success)" }}>
                        {effectiveIntl ? "—" : shippingCost === 0 ? "Free" : formatINR(shippingCost)}
                      </span>
                      <p className="text-[11px] font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                        {effectiveIntl ? "International" : "Domestic"}
                      </p>
                    </div>
                  </div>

                  <Button size="lg" className="w-full" loading={savingAddress} onClick={handleContinueDelivery}>
                    Continue to Payment <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>

                  {/* Guest hint */}
                  {!session && (
                    <p className="text-xs text-center font-body" style={{ color: "var(--color-text-muted)" }}>
                      We'll send an OTP to your mobile number to confirm your order
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 1: Payment ───────────────────────────────────────────── */}
            {step === 1 && (
              <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
                <div className="px-6 py-5 border-b flex items-center gap-2.5" style={{ borderColor: "var(--color-parchment)", background: "var(--color-cream)" }}>
                  <CreditCard className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
                  <h2 className="text-base font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>Payment Method</h2>
                </div>
                <div className="p-6 space-y-5">
                  {!paymentCfgLoaded ? (
                    <div className="flex items-center justify-center py-8">
                      <span className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                  ) : (() => {
                    const methods = isPreBooking
                      ? (paymentCfg.razorpay ? [{ value: "netbanking", label: "Pay via Razorpay", desc: "UPI, Cards, Net Banking, Wallets" }] : [])
                      : [
                      ...(paymentCfg.razorpay ? [{ value: "netbanking", label: "Pay via Razorpay",   desc: "UPI, Cards, Net Banking, Wallets" }] : []),
                      ...(paymentCfg.cashfree ? [{ value: "cashfree",   label: "Pay via Cashfree",   desc: "UPI, Cards, Net Banking, Wallets" }] : []),
                      ...(paymentCfg.iciciPg  ? [{ value: "icici-pg",   label: "ICICI UPI / Pay",    desc: "UPI, Cards, Net Banking — lower fees, instant credit" }] : []),
                      ...(paymentCfg.icici    ? [{ value: "icici",      label: "ICICI Eazypay",      desc: "All major cards & net banking"    }] : []),
                      ...(paymentCfg.cod      ? [{ value: "cod",        label: "Cash on Delivery",   desc: ""                                 }] : []),
                    ] as { value: string; label: string; desc: string }[];

                    return methods.length === 0 ? (
                      <div className="flex items-start gap-3 p-4 rounded-lg border text-sm font-body"
                        style={{ background: "#FEF9C3", borderColor: "#FCD34D", color: "#92400E" }}>
                        <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#D97706" }} />
                        <p>{isPreBooking ? "Pre-booked items can currently only be paid for via Razorpay, and it isn't configured yet. Please contact us to complete your order." : "No payment methods are currently available. Please contact us to complete your order."}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {methods.map(({ value, label, desc }) => (
                          <label key={value}
                            className="flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all"
                            style={{ borderColor: payment === value ? "var(--color-primary)" : "var(--color-parchment)", background: payment === value ? "var(--color-primary-50)" : "white" }}>
                            <input type="radio" className="accent-primary" checked={payment === value} onChange={() => setPayment(value as any)} />
                            <div>
                              <p className="text-sm font-medium font-body" style={{ color: "var(--color-text-primary)" }}>{label}</p>
                              {desc && (
                                <p className="text-xs font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>{desc}</p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    );
                  })()}

                  <div className="flex gap-3 pt-1">
                    <Button variant="secondary" onClick={() => setStep(0)} className="shrink-0">← Back</Button>
                    <Button size="lg" className="flex-1" disabled={!payment || !paymentCfgLoaded} onClick={() => setStep(2)}>
                      Review Order <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Review ────────────────────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
                  <div className="px-6 py-5 border-b flex items-center gap-2.5" style={{ borderColor: "var(--color-parchment)", background: "var(--color-cream)" }}>
                    <ClipboardList className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
                    <h2 className="text-base font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>Review Your Order</h2>
                  </div>
                  <div className="p-6 space-y-5">

                    {/* Address summary */}
                    <div className="p-4 rounded-lg" style={{ background: "var(--color-ivory)", border: "1px solid var(--color-parchment)" }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-semibold uppercase tracking-wide font-body flex items-center gap-1.5" style={{ color: "var(--color-text-muted)" }}>
                          <MapPin className="h-3.5 w-3.5" /> Delivery Address
                        </p>
                        <button onClick={() => setStep(0)} className="text-xs font-medium" style={{ color: "var(--color-primary)" }}>Edit</button>
                      </div>
                      {activeAddress ? (
                        <>
                          <p className="text-sm font-body font-medium" style={{ color: "var(--color-text-primary)" }}>
                            {activeAddress.fullName} · {activeAddress.phone}
                          </p>
                          <p className="text-sm font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                            {activeAddress.addressLine1}{activeAddress.addressLine2 ? ", " + activeAddress.addressLine2 : ""},{" "}
                            {activeAddress.city}, {activeAddress.state} — {activeAddress.pincode}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm font-body" style={{ color: "var(--color-error)" }}>No address selected</p>
                      )}
                    </div>

                    {/* Payment summary */}
                    <div className="p-4 rounded-lg" style={{ background: "var(--color-ivory)", border: "1px solid var(--color-parchment)" }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-semibold uppercase tracking-wide font-body flex items-center gap-1.5" style={{ color: "var(--color-text-muted)" }}>
                          <CreditCard className="h-3.5 w-3.5" /> Payment
                        </p>
                        <button onClick={() => setStep(1)} className="text-xs font-medium" style={{ color: "var(--color-primary)" }}>Edit</button>
                      </div>
                      <p className="text-sm font-body" style={{ color: payment ? "var(--color-text-primary)" : "var(--color-error)" }}>
                        {payment === "netbanking" ? "Razorpay" : payment === "cashfree" ? "Cashfree" : payment === "icici-pg" ? "ICICI UPI / Pay" : payment === "icici" ? "ICICI Eazypay" : payment === "cod" ? "Cash on Delivery" : "No payment method selected"}
                      </p>
                    </div>

                    {/* Items */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide font-body" style={{ color: "var(--color-text-muted)" }}>
                        Items ({totalQty})
                      </p>
                      {items.map((item) => (
                        <div key={item.variantId} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: "var(--color-parchment)" }}>
                          <div className="relative w-12 h-16 rounded-md shrink-0 overflow-hidden" style={{ background: item.colorHex + "30", border: "1px solid var(--color-parchment)" }}>
                            {item.imageUrl && <SmartImage src={item.imageUrl} alt="" fill objectFit="cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium font-body line-clamp-1" style={{ color: "var(--color-text-primary)" }}>{item.productName}</p>
                            <p className="text-xs font-body mt-0.5" style={{ color: "var(--color-text-muted)" }}>{item.variantColor} · Qty: {item.quantity}</p>
                          </div>
                          <span style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "15px", color: "var(--color-primary)" }}>
                            {formatINR(item.salePrice * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Pre-Booking summary + consent */}
                    {isPreBooking && (
                      <div className="rounded-lg p-4 space-y-2.5" style={{ background: "var(--color-gold-light)" }}>
                        <p className="text-sm font-body font-semibold flex items-center gap-1.5" style={{ color: "var(--color-gold-dark)" }}>
                          ✦ Pre-Booking Order
                        </p>
                        {preBookingEtaLabel && (
                          <p className="text-xs font-body" style={{ color: "var(--color-text-secondary)" }}>{preBookingEtaLabel}</p>
                        )}
                        <label
                          className="flex items-start gap-2.5 cursor-pointer select-none pt-1"
                          onClick={() => setPreBookingConsent((v) => !v)}
                        >
                          <div
                            className="relative w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all"
                            style={{
                              borderColor: preBookingConsent ? "var(--color-gold-dark)" : "var(--color-parchment)",
                              background: preBookingConsent ? "var(--color-gold-dark)" : "white",
                            }}
                          >
                            {preBookingConsent && (
                              <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <span className="text-xs font-body" style={{ color: "var(--color-text-secondary)" }}>
                            I understand this is a pre-booked item{preBookingEtaLabel ? `, expected ${preBookingEtaLabel.toLowerCase()}` : ""}, and it ships separately from any other items I've ordered.
                          </span>
                        </label>
                      </div>
                    )}

                    {/* Place order */}
                    <div className="pt-2 space-y-3">
                      <Button size="xl" className="w-full" loading={placing} disabled={!payment || (isPreBooking && !preBookingConsent)} onClick={placeOrder}>
                        {!placing && <Check className="mr-2 h-5 w-5" />}
                        {finalTotal === 0 ? "Place Order · Pay from Wallet" : `Place Order · ${formatINR(finalTotal)}`}
                      </Button>
                      <div className="flex items-center justify-center gap-2">
                        <ShieldCheck className="h-4 w-4" style={{ color: "var(--color-success)" }} />
                        <p className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>Secure checkout · 100% encrypted</p>
                      </div>
                    </div>
                  </div>
                </div>

                <button onClick={() => setStep(1)} className="text-sm font-body font-medium" style={{ color: "var(--color-primary)" }}>
                  ← Back to Payment
                </button>
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          <div className="w-full lg:w-80 shrink-0 order-1 lg:order-2">
            <div className="rounded-xl border overflow-hidden sticky top-4" style={{ background: "white", borderColor: "var(--color-parchment)" }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: "var(--color-parchment)", background: "var(--color-cream)" }}>
                <p className="text-sm font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>
                  Order Summary <span className="font-normal ml-1" style={{ color: "var(--color-text-muted)" }}>({totalQty} items)</span>
                </p>
              </div>
              <div className="p-5 space-y-3">
                <div className="space-y-2 pb-3 border-b" style={{ borderColor: "var(--color-parchment)" }}>
                  {items.map((item) => (
                    <div key={item.variantId} className="flex justify-between text-sm font-body">
                      <span className="line-clamp-1 flex-1 mr-2" style={{ color: "var(--color-text-muted)" }}>{item.productName} × {item.quantity}</span>
                      <span style={{ color: "var(--color-text-primary)" }}>{formatINR(item.salePrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                {/* Coupon — not available on pre-booking checkouts in this release */}
                {!isPreBooking && (
                  <div className="pb-1">
                    <CouponPicker
                      subtotal={sub}
                      applied={coupon}
                      onApply={setCoupon}
                      onRemove={removeCoupon}
                    />
                  </div>
                )}

                {/* Wallet */}
                {walletBalance > 0 && (
                  <div className="rounded-lg border overflow-hidden" style={{ borderColor: useWallet ? "var(--color-primary)" : "var(--color-parchment)" }}>
                    <div
                      className="flex items-center justify-between px-3.5 py-3 cursor-pointer select-none"
                      style={{ background: useWallet ? "var(--color-primary-50)" : "var(--color-ivory)" }}
                      onClick={() => setUseWallet(u => !u)}
                    >
                      <div className="flex items-center gap-2.5">
                        <Wallet className="h-4 w-4 shrink-0" style={{ color: useWallet ? "var(--color-primary)" : "var(--color-text-muted)" }} />
                        <div>
                          <p className="text-sm font-semibold font-body" style={{ color: "var(--color-text-primary)" }}>
                            Wallet Balance
                          </p>
                          <p className="text-xs font-body" style={{ color: useWallet ? "var(--color-primary)" : "var(--color-text-muted)" }}>
                            {formatINR(walletBalance)} available
                          </p>
                        </div>
                      </div>
                      {/* Toggle */}
                      <div className="relative w-9 h-5 rounded-full transition-colors shrink-0"
                        style={{ background: useWallet ? "var(--color-primary)" : "#D1D5DB" }}>
                        <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all"
                          style={{ left: useWallet ? "18px" : "2px" }} />
                      </div>
                    </div>
                    {useWallet && walletDeduction > 0 && (
                      <div className="px-3.5 py-2 border-t flex items-center justify-between"
                        style={{ borderColor: "var(--color-primary)", background: "white" }}>
                        <span className="text-xs font-body" style={{ color: "var(--color-success)" }}>Wallet applied</span>
                        <span className="text-sm font-semibold font-body" style={{ color: "var(--color-success)" }}>
                          −{formatINR(walletDeduction)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm font-body">
                    <span style={{ color: "var(--color-text-muted)" }}>Subtotal</span>
                    <span style={{ color: "var(--color-text-primary)" }}>{formatINR(sub)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm font-body">
                      <span style={{ color: "var(--color-success)" }}>Discount ({coupon?.code})</span>
                      <span style={{ color: "var(--color-success)", fontWeight: 600 }}>−{formatINR(discount)}</span>
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-sm font-body">
                      <span style={{ color: "var(--color-text-muted)" }}>
                        Shipping
                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold align-middle"
                          style={{
                            background: effectiveIntl ? "#EFF6FF" : "#F0FDF4",
                            color: effectiveIntl ? "#1D4ED8" : "#15803D",
                          }}>
                          {effectiveIntl ? "International" : "Domestic"}
                        </span>
                      </span>
                      {effectiveIntl ? (
                        <span className="relative inline-block">
                          {shippingConfig.internationalShippingNote && (
                            <button
                              type="button"
                              onClick={() => setShowSummaryIntlNote(v => !v)}
                              onMouseEnter={() => setShowSummaryIntlNote(true)}
                              onMouseLeave={() => setShowSummaryIntlNote(false)}
                              aria-label="International shipping details"
                              className="absolute -top-3 -right-1 cursor-help"
                              style={{ color: "#1D4ED8" }}
                            >
                              <Info className="h-3 w-3" />
                            </button>
                          )}
                          <span
                            className="block whitespace-nowrap text-xs font-medium underline decoration-dotted underline-offset-2"
                            style={{ color: "#1D4ED8" }}
                          >
                            Charges Applicable
                          </span>
                          {showSummaryIntlNote && shippingConfig.internationalShippingNote && (
                            <div
                              className="absolute right-0 top-full mt-2 w-72 z-20 p-3 rounded-md shadow-lg"
                              style={{ background: "white", border: "1px solid var(--color-parchment)" }}
                            >
                              <p className="text-xs font-body whitespace-pre-line leading-relaxed text-left" style={{ color: "var(--color-text-secondary)" }}>
                                {shippingConfig.internationalShippingNote}
                              </p>
                            </div>
                          )}
                        </span>
                      ) : (
                        <span style={{ color: shippingCost === 0 ? "var(--color-success)" : "var(--color-text-primary)", fontWeight: shippingCost === 0 ? 600 : 400 }}>
                          {shippingCost === 0 ? "Free" : formatINR(shippingCost)}
                        </span>
                      )}
                    </div>
                    {!effectiveIntl && shippingCost > 0 && (
                      <p className="text-[11px] font-body" style={{ color: "var(--color-text-muted)" }}>
                        {totalQty} saree{totalQty > 1 ? "s" : ""} · ₹{shippingConfig.firstSareeRate} + {Math.max(0, totalQty - 1)}×₹{shippingConfig.additionalSareeRate}
                      </p>
                    )}
                    {!effectiveIntl && shippingCost === 0 && !coupon?.freeShipping && (
                      <p className="text-[11px] font-body" style={{ color: "var(--color-success)" }}>
                        Free above {formatINR(shippingConfig.freeShippingThreshold)}
                      </p>
                    )}
                    {coupon?.freeShipping && (
                      <p className="text-[11px] font-body" style={{ color: "var(--color-success)" }}>Coupon applied — free shipping</p>
                    )}
                  </div>
                </div>
                <div className="gold-divider" />
                {walletDeduction > 0 && (
                  <div className="flex justify-between text-sm font-body">
                    <span style={{ color: "var(--color-success)" }}>Wallet</span>
                    <span style={{ color: "var(--color-success)", fontWeight: 600 }}>−{formatINR(walletDeduction)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="font-semibold font-body text-base" style={{ color: "var(--color-text-primary)" }}>
                    {walletDeduction > 0 ? "Amount to Pay" : "Total"}
                  </span>
                  <span style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "var(--text-price)", color: "var(--color-primary)" }}>
                    {formatINR(finalTotal)}
                  </span>
                </div>
                {walletDeduction > 0 && (
                  <p className="text-[11px] font-body" style={{ color: "var(--color-text-muted)" }}>
                    {finalTotal === 0 ? "Fully paid from wallet — no payment needed" : `${formatINR(walletDeduction)} from wallet + ${formatINR(finalTotal)} via ${payment === "cashfree" ? "Cashfree" : payment === "icici-pg" ? "ICICI UPI / Pay" : payment === "icici" ? "ICICI Eazypay" : "COD"}`}
                  </p>
                )}
                <p className="text-[11px] font-body" style={{ color: "var(--color-text-muted)" }}>Includes {formatINR(gstAmount)} GST</p>
              </div>
              <div className="px-5 pb-5 pt-1">
                <div className="p-3 rounded-lg" style={{ background: "var(--color-ivory)" }}>
                  {["100% genuine handwoven sarees", "Easy 7-day returns", "Secure payment gateway"].map((t) => (
                    <div key={t} className="flex items-center gap-2 py-1">
                      <Check className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-success)" }} />
                      <span className="text-[11px] font-body" style={{ color: "var(--color-text-muted)" }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
