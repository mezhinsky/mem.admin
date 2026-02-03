import { Node, mergeAttributes } from "@tiptap/core";

export interface PaintBlockOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    paintBlock: {
      setPaintBlock: (attributes: { name: string; color: string }) => ReturnType;
    };
  }
}

// Определяем, светлый ли цвет (для выбора цвета текста)
function isLightColor(hex: string): boolean {
  const color = hex.replace("#", "");
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  // Формула относительной яркости
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

export const PaintBlock = Node.create<PaintBlockOptions>({
  name: "paintBlock",

  group: "block",

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      name: {
        default: "Краска",
      },
      color: {
        default: "#3b82f6",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="paint-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "paint-block",
        class: "paint-block",
      }),
    ];
  },

  addCommands() {
    return {
      setPaintBlock:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          });
        },
    };
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("div");
      const color = node.attrs.color || "#3b82f6";
      const name = node.attrs.name || "Краска";
      const textColor = isLightColor(color) ? "#1e293b" : "#ffffff";

      dom.classList.add(
        "paint-block",
        "flex",
        "items-center",
        "gap-3",
        "p-4",
        "my-4",
        "rounded-lg",
        "border",
        "border-slate-200",
        "transition-all"
      );
      dom.setAttribute("data-type", "paint-block");
      dom.style.backgroundColor = color;

      // Color swatch circle
      const swatchContainer = document.createElement("div");
      swatchContainer.classList.add(
        "flex-shrink-0",
        "w-10",
        "h-10",
        "rounded-full",
        "border-2",
        "border-white/50",
        "shadow-inner",
        "flex",
        "items-center",
        "justify-center"
      );
      swatchContainer.style.backgroundColor = color;
      swatchContainer.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.1)";

      // Paint drop icon
      swatchContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${textColor}" fill-opacity="0.3" stroke="${textColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>`;

      // Content
      const contentContainer = document.createElement("div");
      contentContainer.classList.add("flex-1", "min-w-0");

      const nameEl = document.createElement("div");
      nameEl.classList.add("font-semibold", "truncate");
      nameEl.style.color = textColor;
      nameEl.textContent = name;

      const colorCodeEl = document.createElement("div");
      colorCodeEl.classList.add("text-sm", "font-mono", "opacity-75");
      colorCodeEl.style.color = textColor;
      colorCodeEl.textContent = color.toUpperCase();

      contentContainer.appendChild(nameEl);
      contentContainer.appendChild(colorCodeEl);

      dom.appendChild(swatchContainer);
      dom.appendChild(contentContainer);

      return {
        dom,
      };
    };
  },
});

export { isLightColor };
export default PaintBlock;
