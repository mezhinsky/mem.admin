/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Youtube from "@tiptap/extension-youtube";
import CharacterCount from "@tiptap/extension-character-count";
import Typography from "@tiptap/extension-typography";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";

import {
  CloudStorageLink,
  detectCloudStorageProvider,
  CLOUD_STORAGE_LABELS,
} from "./extensions/cloud-storage-link";
import { HistoricalNote } from "./extensions/historical-note";
import { PaintBlock } from "./extensions/paint-block";

import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import FileManager from "@/components/file-manager/file-manager";

import {
  Bold,
  Code,
  Eraser,
  Heading2,
  Heading3,
  Heading4,
  Italic,
  Link as LinkIcon,
  Link2Off,
  List,
  ListOrdered,
  Minus,
  Quote,
  Strikethrough,
  Underline as UnderlineIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Youtube as YoutubeIcon,
  Undo,
  Redo,
  Palette,
  CloudIcon,
  ScrollText,
  Paintbrush,
} from "lucide-react";

import { cn } from "@/lib/utils";

// Инициализация lowlight с популярными языками
const lowlight = createLowlight(common);

// Список языков для выбора
const CODE_LANGUAGES = [
  { value: null, label: "auto" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash" },
  { value: "shell", label: "Shell" },
  { value: "json", label: "JSON" },
  { value: "xml", label: "XML" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "scss", label: "SCSS" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
  { value: "graphql", label: "GraphQL" },
  { value: "dockerfile", label: "Dockerfile" },
];

// Предустановленные цвета
const COLORS = [
  "#000000",
  "#434343",
  "#666666",
  "#999999",
  "#b7b7b7",
  "#cccccc",
  "#d9d9d9",
  "#efefef",
  "#f3f3f3",
  "#ffffff",
  "#980000",
  "#ff0000",
  "#ff9900",
  "#ffff00",
  "#00ff00",
  "#00ffff",
  "#4a86e8",
  "#0000ff",
  "#9900ff",
  "#ff00ff",
];

interface AdminEditorProps {
  initialContent?: any;
  onChange?: (json: any) => void;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  tooltip: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  tooltip,
  children,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "h-8 w-8",
            isActive && "bg-muted text-foreground"
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

export default function AdminEditor({
  initialContent,
  onChange,
}: AdminEditorProps) {
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubePopoverOpen, setYoutubePopoverOpen] = useState(false);
  const [cloudStorageUrl, setCloudStorageUrl] = useState("");
  const [cloudStorageTitle, setCloudStorageTitle] = useState("");
  const [cloudStoragePopoverOpen, setCloudStoragePopoverOpen] = useState(false);
  const [paintName, setPaintName] = useState("");
  const [paintColor, setPaintColor] = useState("#3b82f6");
  const [paintPopoverOpen, setPaintPopoverOpen] = useState(false);

  const lastInitialContent = useRef<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        codeBlock: false, // Заменяем на CodeBlockLowlight
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: null,
        HTMLAttributes: {
          class: "rounded-lg my-4",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full rounded-md my-4",
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer",
        },
      }),
      Placeholder.configure({
        placeholder: "Начните писать статью...",
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Subscript,
      Superscript,
      Youtube.configure({
        HTMLAttributes: {
          class: "w-full aspect-video rounded-lg my-4",
        },
      }),
      CharacterCount,
      Typography,
      TextStyle,
      Color,
      CloudStorageLink,
      HistoricalNote,
      PaintBlock,
    ],
    content: initialContent ?? "",
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
  });

  useEffect(() => {
    if (!editor || !initialContent) return;

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

  const setLink = useCallback(() => {
    if (!editor) return;

    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run();
    }
    setLinkUrl("");
    setLinkPopoverOpen(false);
  }, [editor, linkUrl]);

  const addYoutube = useCallback(() => {
    if (!editor || !youtubeUrl) return;

    editor.commands.setYoutubeVideo({ src: youtubeUrl });
    setYoutubeUrl("");
    setYoutubePopoverOpen(false);
  }, [editor, youtubeUrl]);

  const addCloudStorageLink = useCallback(() => {
    if (!editor || !cloudStorageUrl) return;

    const provider = detectCloudStorageProvider(cloudStorageUrl);
    const title =
      cloudStorageTitle.trim() || CLOUD_STORAGE_LABELS[provider] || "Файл";

    editor.commands.setCloudStorageLink({
      url: cloudStorageUrl,
      provider,
      title,
    });

    toast.success("Ссылка на облачное хранилище добавлена");
    setCloudStorageUrl("");
    setCloudStorageTitle("");
    setCloudStoragePopoverOpen(false);
  }, [editor, cloudStorageUrl, cloudStorageTitle]);

  const addPaintBlock = useCallback(() => {
    if (!editor || !paintName.trim()) return;

    editor.commands.setPaintBlock({
      name: paintName.trim(),
      color: paintColor,
    });

    toast.success("Блок краски добавлен");
    setPaintName("");
    setPaintColor("#3b82f6");
    setPaintPopoverOpen(false);
  }, [editor, paintName, paintColor]);

  const handleImageSelect = useCallback(
    (asset: any) => {
      if (!editor) return;

      const variantsValue = asset?.metadata?.variants;
      const variants =
        variantsValue &&
        typeof variantsValue === "object" &&
        !Array.isArray(variantsValue)
          ? variantsValue
          : null;

      const src =
        (variants &&
        typeof (variants as Record<string, unknown>)["lg"] === "string"
          ? ((variants as Record<string, unknown>)["lg"] as string)
          : null) ||
        (variants &&
        typeof (variants as Record<string, unknown>)["md"] === "string"
          ? ((variants as Record<string, unknown>)["md"] as string)
          : null) ||
        (variants &&
        typeof (variants as Record<string, unknown>)["original"] === "string"
          ? ((variants as Record<string, unknown>)["original"] as string)
          : null) ||
        asset.url;

      editor.chain().focus().setImage({ src, alt: asset.originalName }).run();
      toast.success("Изображение добавлено");
      setAssetPickerOpen(false);
    },
    [editor]
  );

  if (!editor) return null;

  const characterCount = editor.storage.characterCount;

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="flex flex-wrap items-center gap-0.5 p-2">
          {/* History */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            tooltip="Отменить (Ctrl+Z)"
          >
            <Undo size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            tooltip="Повторить (Ctrl+Y)"
          >
            <Redo size={16} />
          </ToolbarButton>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Text formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            tooltip="Жирный (Ctrl+B)"
          >
            <Bold size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            tooltip="Курсив (Ctrl+I)"
          >
            <Italic size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            tooltip="Подчёркнутый (Ctrl+U)"
          >
            <UnderlineIcon size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            tooltip="Зачёркнутый"
          >
            <Strikethrough size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive("highlight")}
            tooltip="Выделение маркером"
          >
            <Highlighter size={16} />
          </ToolbarButton>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Subscript/Superscript */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            isActive={editor.isActive("subscript")}
            tooltip="Подстрочный"
          >
            <SubscriptIcon size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            isActive={editor.isActive("superscript")}
            tooltip="Надстрочный"
          >
            <SuperscriptIcon size={16} />
          </ToolbarButton>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Palette size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="grid grid-cols-10 gap-1">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-5 h-5 rounded border border-gray-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() =>
                      editor.chain().focus().setColor(color).run()
                    }
                  />
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2"
                onClick={() => editor.chain().focus().unsetColor().run()}
              >
                Сбросить цвет
              </Button>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Headings */}
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            isActive={editor.isActive("heading", { level: 2 })}
            tooltip="Заголовок 2"
          >
            <Heading2 size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            isActive={editor.isActive("heading", { level: 3 })}
            tooltip="Заголовок 3"
          >
            <Heading3 size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 4 }).run()
            }
            isActive={editor.isActive("heading", { level: 4 })}
            tooltip="Заголовок 4"
          >
            <Heading4 size={16} />
          </ToolbarButton>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Alignment */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            isActive={editor.isActive({ textAlign: "left" })}
            tooltip="По левому краю"
          >
            <AlignLeft size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            isActive={editor.isActive({ textAlign: "center" })}
            tooltip="По центру"
          >
            <AlignCenter size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            isActive={editor.isActive({ textAlign: "right" })}
            tooltip="По правому краю"
          >
            <AlignRight size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            isActive={editor.isActive({ textAlign: "justify" })}
            tooltip="По ширине"
          >
            <AlignJustify size={16} />
          </ToolbarButton>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            tooltip="Маркированный список"
          >
            <List size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            tooltip="Нумерованный список"
          >
            <ListOrdered size={16} />
          </ToolbarButton>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Blocks */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            tooltip="Цитата"
          >
            <Quote size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHistoricalNote().run()}
            isActive={editor.isActive("historicalNote")}
            tooltip="Историческая справка"
          >
            <ScrollText size={16} />
          </ToolbarButton>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  editor.isActive("codeBlock") && "bg-muted text-foreground"
                )}
              >
                <Code size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2">
              <div className="grid gap-1 max-h-64 overflow-y-auto">
                {CODE_LANGUAGES.map((lang) => (
                  <Button
                    key={lang.value ?? "auto"}
                    variant="ghost"
                    size="sm"
                    className="justify-start h-7 text-xs"
                    onClick={() => {
                      if (editor.isActive("codeBlock")) {
                        editor
                          .chain()
                          .focus()
                          .updateAttributes("codeBlock", {
                            language: lang.value,
                          })
                          .run();
                      } else {
                        editor
                          .chain()
                          .focus()
                          .toggleCodeBlock(
                            lang.value
                              ? { language: lang.value }
                              : undefined
                          )
                          .run();
                      }
                    }}
                  >
                    {lang.label}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            tooltip="Горизонтальная линия"
          >
            <Minus size={16} />
          </ToolbarButton>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Link */}
          <Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  editor.isActive("link") && "bg-muted text-foreground"
                )}
              >
                <LinkIcon size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <Input
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && setLink()}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={setLink} className="flex-1">
                    {editor.isActive("link") ? "Обновить" : "Добавить"}
                  </Button>
                  {editor.isActive("link") && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        editor.chain().focus().unsetLink().run();
                        setLinkPopoverOpen(false);
                      }}
                    >
                      <Link2Off size={14} />
                    </Button>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Image */}
          <ToolbarButton
            onClick={() => setAssetPickerOpen(true)}
            tooltip="Вставить изображение"
          >
            <ImageIcon size={16} />
          </ToolbarButton>

          {/* YouTube */}
          <Popover
            open={youtubePopoverOpen}
            onOpenChange={setYoutubePopoverOpen}
          >
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <YoutubeIcon size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addYoutube()}
                />
                <Button size="sm" onClick={addYoutube} className="w-full">
                  Вставить видео
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Cloud Storage Link */}
          <Popover
            open={cloudStoragePopoverOpen}
            onOpenChange={setCloudStoragePopoverOpen}
          >
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CloudIcon size={16} />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    Ссылка на облачное хранилище
                  </TooltipContent>
                </Tooltip>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <div className="text-sm font-medium text-slate-700">
                  Ссылка на файл в облаке
                </div>
                <Input
                  placeholder="https://drive.google.com/..."
                  value={cloudStorageUrl}
                  onChange={(e) => setCloudStorageUrl(e.target.value)}
                />
                <Input
                  placeholder="Название (опционально)"
                  value={cloudStorageTitle}
                  onChange={(e) => setCloudStorageTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCloudStorageLink()}
                />
                {cloudStorageUrl && (
                  <div className="text-xs text-slate-500">
                    Определён сервис:{" "}
                    <span className="font-medium">
                      {CLOUD_STORAGE_LABELS[
                        detectCloudStorageProvider(cloudStorageUrl)
                      ] || "Неизвестный"}
                    </span>
                  </div>
                )}
                <Button
                  size="sm"
                  onClick={addCloudStorageLink}
                  className="w-full"
                  disabled={!cloudStorageUrl}
                >
                  Добавить ссылку
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Paint Block */}
          <Popover open={paintPopoverOpen} onOpenChange={setPaintPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Paintbrush size={16} />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    Блок краски
                  </TooltipContent>
                </Tooltip>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <div className="text-sm font-medium text-slate-700">
                  Блок краски
                </div>
                <Input
                  placeholder="Название краски (например: RAL 3020)"
                  value={paintName}
                  onChange={(e) => setPaintName(e.target.value)}
                />
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg border border-slate-200 shadow-inner flex-shrink-0"
                    style={{ backgroundColor: paintColor }}
                  />
                  <Input
                    type="text"
                    placeholder="#3b82f6"
                    value={paintColor}
                    onChange={(e) => setPaintColor(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addPaintBlock()}
                    className="font-mono"
                  />
                  <input
                    type="color"
                    value={paintColor}
                    onChange={(e) => setPaintColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={addPaintBlock}
                  className="w-full"
                  disabled={!paintName.trim()}
                >
                  Добавить блок
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Clear */}
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().unsetAllMarks().clearNodes().run()
            }
            tooltip="Очистить форматирование"
          >
            <Eraser size={16} />
          </ToolbarButton>
        </div>
      </div>

      {/* Editor content */}
      <EditorContent
        editor={editor}
        className="prose-content min-h-[300px] p-4 focus-visible:outline-none [&_.ProseMirror]:min-h-[280px] [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
      />

      {/* Footer with character count */}
      <div className="border-t px-4 py-2 text-xs text-muted-foreground flex justify-end gap-4">
        <span>{characterCount?.characters() ?? 0} символов</span>
        <span>{characterCount?.words() ?? 0} слов</span>
      </div>

      {/* Image picker dialog */}
      <Dialog open={assetPickerOpen} onOpenChange={setAssetPickerOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] grid-rows-[auto_1fr] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Выберите изображение</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 overflow-y-auto">
            <FileManager
              mode="pick"
              types={["IMAGE"]}
              accept="image/*"
              onPick={handleImageSelect}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
