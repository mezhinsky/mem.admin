"use client";
import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface AdminEditorProps {
  initialContent?: any;
  onChange?: (json: any) => void;
}

export default function AdminEditor({
  initialContent,
  onChange,
}: AdminEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Загрузка...</p>", // стартовое значение
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange?.(json);
    },
  });

  // 🧠 Синхронизируем, когда приходит новое initialContent
  useEffect(() => {
    if (editor && initialContent) {
      // если пришёл JSON из API
      if (typeof initialContent === "object") {
        editor.commands.setContent(initialContent);
      } else {
        // если пришёл HTML
        editor.commands.setContent(initialContent);
      }
    }
  }, [initialContent, editor]);

  if (!editor) return null;

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex gap-2 mb-2 border-b pb-2">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="font-bold"
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="italic"
        >
          I
        </button>
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          H2
        </button>
        <button onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          Code block
        </button>
      </div>

      <EditorContent editor={editor} style={{ outlineColor: "transparent" }} />
    </div>
  );
}
