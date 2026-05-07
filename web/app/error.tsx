"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Error Caught:", error);
  }, [error]);

  return (
    <div style={{ padding: "50px", fontFamily: "sans-serif", textAlign: "center" }}>
      <h2>Something went wrong!</h2>
      <p style={{ color: "red", maxWidth: "600px", margin: "20px auto", textAlign: "left", padding: "20px", background: "#fee", borderRadius: "8px" }}>
        {error.message || "Unknown error"}
      </p>
      <button
        onClick={() => reset()}
        style={{ padding: "10px 20px", background: "black", color: "white", borderRadius: "5px", cursor: "pointer" }}
      >
        Try again
      </button>
    </div>
  );
}
