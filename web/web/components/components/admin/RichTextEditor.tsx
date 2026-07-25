"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Loaded client-side only — CKEditor uses browser APIs
const CKEditorComponent = dynamic(
  () => import("./RichTextEditorInner"),
  { ssr: false, loading: () => <EditorSkeleton /> }
);

function EditorSkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <div className="h-10 border-b px-3 flex items-center gap-2" style={{ background: "#F9FAFB", borderColor: "#E5E7EB" }}>
        {[40, 32, 48, 32, 56].map((w, i) => (
          <div key={i} className="h-4 rounded animate-pulse" style={{ width: w, background: "#E5E7EB" }} />
        ))}
      </div>
      <div className="p-4 space-y-2 min-h-[140px]">
        {[100, 80, 60].map((w, i) => (
          <div key={i} className="h-3 rounded animate-pulse" style={{ width: `${w}%`, background: "#F3F4F6" }} />
        ))}
      </div>
    </div>
  );
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <EditorSkeleton />;
  return <CKEditorComponent value={value} onChange={onChange} placeholder={placeholder} />;
}
