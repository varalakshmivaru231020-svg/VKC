/**
 * Holding page shown to storefront visitors while maintenance mode is on.
 * Deliberately self-contained — no header, footer, cart or nav — so a visitor
 * cannot click through into a store that is mid-update.
 */
export function MaintenanceScreen({
  title,
  message,
  siteName,
  logoUrl,
}: {
  title: string;
  message: string;
  siteName?: string;
  logoUrl?: string | null;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-16"
      style={{ background: "var(--color-ivory)" }}
    >
      <div className="max-w-lg w-full text-center space-y-6">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={siteName ?? "Logo"}
            className="mx-auto object-contain"
            style={{ maxHeight: 72, maxWidth: 240 }}
          />
        ) : (
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.5rem, 4vw, 2rem)",
              color: "var(--color-primary)",
            }}
          >
            {siteName ?? "VKC Gold"}
          </p>
        )}

        <div className="h-px w-16 mx-auto" style={{ background: "var(--color-gold)" }} />

        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "var(--text-h2)",
            fontWeight: "var(--weight-heading)",
            color: "var(--color-text-primary)",
          }}
        >
          {title}
        </h1>

        <p
          className="text-center"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-body)",
            lineHeight: "var(--leading-body)",
            color: "var(--color-text-secondary)",
            whiteSpace: "pre-line",
          }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}
