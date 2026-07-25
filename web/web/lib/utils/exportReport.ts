"use client";

export function exportCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))];
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename + ".csv");
}

export async function exportExcel(filename: string, headers: string[], rows: (string | number)[][]) {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const colWidths = headers.map((h, i) => {
    const maxLen = Math.max(h.length, ...rows.map((r) => String(r[i] ?? "").length));
    return { wch: Math.min(maxLen + 2, 40) };
  });
  ws["!cols"] = colWidths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, filename + ".xlsx");
}

export async function exportPDF(
  filename: string,
  title: string,
  headers: string[],
  rows: (string | number)[][],
  subtitle?: string,
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(139, 90, 43);
  doc.text("Vijaylakshmi Sarees", 14, 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text(title, 14, 23);

  if (subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(subtitle, 14, 30);
  }

  autoTable(doc, {
    startY: subtitle ? 35 : 28,
    head: [headers],
    body: rows.map((r) => r.map((v) => String(v ?? ""))),
    headStyles: { fillColor: [139, 90, 43], textColor: 255, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [250, 245, 235] },
    margin: { left: 14, right: 14 },
  });

  doc.save(filename + ".pdf");
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
