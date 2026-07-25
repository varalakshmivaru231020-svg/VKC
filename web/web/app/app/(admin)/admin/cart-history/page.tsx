import CartHistoryClient from "./CartHistoryClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cart History — Admin" };

export default function CartHistoryPage() {
  return <CartHistoryClient />;
}
