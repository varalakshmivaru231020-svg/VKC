import { MessageCircle } from "lucide-react";

/** Floating WhatsApp chat bubble — only renders once a number is set in
 *  Admin → Settings → SMS/WhatsApp (`whatsapp_number`). No placeholder number. */
export function WhatsAppFloatButton({ phoneNumber }: { phoneNumber?: string }) {
  const number = phoneNumber?.replace(/\D/g, "");
  if (!number) return null;

  return (
    <a
      href={`https://wa.me/${number}?text=${encodeURIComponent("Hi! I'd like to know more about your sarees.")}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
      style={{ background: "#25D366" }}
    >
      <MessageCircle className="h-7 w-7 text-white" fill="white" strokeWidth={1.5} />
    </a>
  );
}
