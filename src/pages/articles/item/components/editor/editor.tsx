"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button } from "@/components/ui/button";
import Image from "@tiptap/extension-image";
import { toast } from "sonner";

import {
  Bold,
  Code,
  Eraser,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Strikethrough,
  Underline,
  Image as ImageIcon,
} from "lucide-react";
import { useEffect, useRef } from "react";

interface AdminEditorProps {
  initialContent?: any; // JSON или HTML один раз при загрузке
  onChange?: (json: any) => void; // только уведомление наверх
}

export default function AdminEditor({
  initialContent,
  onChange,
}: AdminEditorProps) {
  const lastInitialContent = useRef<string | null>(null);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4, 5, 6] },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full rounded-md my-4",
        },
      }),
      // сюда потом можно добавить Underline, Link extension и т.д.
    ],
    content: initialContent ?? "", // начальное значение
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange?.(json); // только наружу, НАЗАД не засовываем
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (!initialContent) return;

    const nextContentSnapshot = JSON.stringify(initialContent);
    const currentSnapshot = JSON.stringify(editor.getJSON());

    if (
      nextContentSnapshot === lastInitialContent.current ||
      nextContentSnapshot === currentSnapshot
    ) {
      lastInitialContent.current = nextContentSnapshot;
      return;
    }

    editor.commands.setContent(initialContent);
    lastInitialContent.current = nextContentSnapshot;
  }, [initialContent, editor]);

  if (!editor) return null;

  const setLink = () => {
    const url = prompt("Enter URL");

    if (!url) return;

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:3000/uploads/images", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Не удалось загрузить изображение");
      }

      const data = await response.json();
      const imageUrl = data.url || data.path || data.location;

      if (!imageUrl) {
        throw new Error("Сервер не вернул ссылку на изображение");
      }

      editor?.chain().focus().setImage({ src: imageUrl, alt: file.name }).run();

      toast.success("Изображение добавлено");
    } catch (error) {
      console.error(error);
      toast.error("Не удалось загрузить изображение");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="sticky top-0 z-20 border-b bg-white px-4 pt-4 pb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="font-bold"
        >
          <Bold size={14} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="italic"
        >
          <Italic size={14} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 4 }).run()
          }
        >
          <Heading4 />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 5 }).run()
          }
        >
          <Heading5 />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 6 }).run()
          }
        >
          <Heading6 />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus />
        </Button>
        <Button variant="ghost" size="icon" onClick={setLink}>
          <LinkIcon />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleImageButtonClick}>
          <ImageIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            editor.chain().focus().unsetAllMarks().clearNodes().run()
          }
        >
          <Eraser />
        </Button>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageUpload}
        />
      </div>

      <EditorContent
        editor={editor}
        className="prose-content min-h-[200px] focus-visible:outline-none"
        style={{ outlineColor: "transparent" }}
      />
    </div>
  );
}
