import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact Us — Vijaylakshmi Sarees",
  description: "Get in touch with Vijaylakshmi Sarees — we're happy to help with orders, styling advice, and wholesale queries.",
};

export default function ContactPage() {
  return <ContactClient />;
}
