"use client";
import React from "react";
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
    content: initialContent || "<p>Напиши статью...</p>",
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange?.(json); // передаём JSON наверх, чтобы сохранить
    },
  });

  if (!editor) return null;

  // простейший тулбар
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
      </div>

      <EditorContent editor={editor} className="prose min-h-[200px]" />
    </div>
  );
}
