"use client";

import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function RichTextEditorInner({ value, onChange, placeholder }: Props) {
  return (
    <div className="ck-editor-wrapper">
      <CKEditor
        editor={ClassicEditor as any}
        data={value}
        config={{
          placeholder: placeholder ?? "Enter description…",
          toolbar: {
            items: [
              "heading", "|",
              "bold", "italic", "underline", "|",
              "bulletedList", "numberedList", "|",
              "blockQuote", "link", "|",
              "undo", "redo",
            ],
          },
          heading: {
            options: [
              { model: "paragraph", title: "Paragraph", class: "ck-heading_paragraph" },
              { model: "heading2", view: "h2", title: "Heading 2", class: "ck-heading_heading2" },
              { model: "heading3", view: "h3", title: "Heading 3", class: "ck-heading_heading3" },
            ],
          },
        }}
        onChange={(_event: any, editor: any) => {
          onChange(editor.getData());
        }}
      />
      <style>{`
        .ck-editor-wrapper .ck-editor__editable_inline {
          min-height: 160px;
          font-family: var(--font-body);
          font-size: 14px;
          color: #111827;
          padding: 12px 16px;
        }
        .ck-editor-wrapper .ck.ck-editor__editable:not(.ck-editor__nested-editable).ck-focused {
          border-color: var(--color-primary) !important;
          box-shadow: 0 0 0 3px var(--color-primary-50) !important;
        }
        .ck-editor-wrapper .ck.ck-toolbar {
          border-color: #E5E7EB !important;
          background: #F9FAFB !important;
        }
        .ck-editor-wrapper .ck.ck-editor__main > .ck-editor__editable {
          border-color: #E5E7EB !important;
          border-top: none !important;
        }
        .ck-editor-wrapper .ck.ck-editor {
          border-radius: 8px !important;
          overflow: hidden !important;
          border: 1px solid #E5E7EB !important;
        }
        .ck-editor-wrapper .ck.ck-toolbar {
          border-bottom: 1px solid #E5E7EB !important;
        }
        .ck-editor-wrapper .ck.ck-button.ck-on {
          color: var(--color-primary) !important;
        }
      `}</style>
    </div>
  );
}
