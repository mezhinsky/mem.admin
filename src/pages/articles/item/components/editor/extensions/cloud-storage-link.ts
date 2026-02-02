import { Node, mergeAttributes } from "@tiptap/core";

export interface CloudStorageLinkOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    cloudStorageLink: {
      setCloudStorageLink: (attributes: {
        url: string;
        provider: string;
        title?: string;
      }) => ReturnType;
    };
  }
}

export type CloudStorageProvider =
  | "google-drive"
  | "icloud"
  | "dropbox"
  | "onedrive"
  | "box"
  | "yandex-disk"
  | "mega"
  | "unknown";

export function detectCloudStorageProvider(url: string): CloudStorageProvider {
  const lowerUrl = url.toLowerCase();

  if (
    lowerUrl.includes("drive.google.com") ||
    lowerUrl.includes("docs.google.com") ||
    lowerUrl.includes("sheets.google.com") ||
    lowerUrl.includes("slides.google.com")
  ) {
    return "google-drive";
  }

  if (lowerUrl.includes("icloud.com")) {
    return "icloud";
  }

  if (lowerUrl.includes("dropbox.com") || lowerUrl.includes("db.tt")) {
    return "dropbox";
  }

  if (
    lowerUrl.includes("onedrive.live.com") ||
    lowerUrl.includes("1drv.ms") ||
    lowerUrl.includes("sharepoint.com")
  ) {
    return "onedrive";
  }

  if (lowerUrl.includes("box.com") || lowerUrl.includes("app.box.com")) {
    return "box";
  }

  if (
    lowerUrl.includes("disk.yandex.ru") ||
    lowerUrl.includes("disk.yandex.com") ||
    lowerUrl.includes("yadi.sk")
  ) {
    return "yandex-disk";
  }

  if (lowerUrl.includes("mega.nz") || lowerUrl.includes("mega.co.nz")) {
    return "mega";
  }

  return "unknown";
}

export const CLOUD_STORAGE_LABELS: Record<CloudStorageProvider, string> = {
  "google-drive": "Google Drive",
  icloud: "iCloud",
  dropbox: "Dropbox",
  onedrive: "OneDrive",
  box: "Box",
  "yandex-disk": "Яндекс Диск",
  mega: "MEGA",
  unknown: "Файл",
};

export const CloudStorageLink = Node.create<CloudStorageLinkOptions>({
  name: "cloudStorageLink",

  group: "block",

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      url: {
        default: null,
      },
      provider: {
        default: "unknown",
      },
      title: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="cloud-storage-link"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "cloud-storage-link",
        class: "cloud-storage-link my-4",
      }),
    ];
  },

  addCommands() {
    return {
      setCloudStorageLink:
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
      dom.classList.add(
        "cloud-storage-link",
        "flex",
        "items-center",
        "gap-3",
        "p-4",
        "my-4",
        "rounded-lg",
        "border",
        "bg-slate-50",
        "hover:bg-slate-100",
        "transition-colors",
        "cursor-pointer"
      );
      dom.setAttribute("data-type", "cloud-storage-link");

      const provider = node.attrs.provider as CloudStorageProvider;
      const title =
        node.attrs.title || CLOUD_STORAGE_LABELS[provider] || "Файл";
      const url = node.attrs.url;

      // Icon container
      const iconContainer = document.createElement("div");
      iconContainer.classList.add(
        "flex-shrink-0",
        "w-10",
        "h-10",
        "rounded-lg",
        "flex",
        "items-center",
        "justify-center"
      );
      iconContainer.innerHTML = getProviderIcon(provider);

      // Content container
      const contentContainer = document.createElement("div");
      contentContainer.classList.add("flex-1", "min-w-0");

      const titleEl = document.createElement("div");
      titleEl.classList.add(
        "font-medium",
        "text-slate-900",
        "truncate"
      );
      titleEl.textContent = title;

      const providerEl = document.createElement("div");
      providerEl.classList.add("text-sm", "text-slate-500");
      providerEl.textContent = CLOUD_STORAGE_LABELS[provider] || "Облачное хранилище";

      contentContainer.appendChild(titleEl);
      contentContainer.appendChild(providerEl);

      // Arrow icon
      const arrowContainer = document.createElement("div");
      arrowContainer.classList.add("flex-shrink-0", "text-slate-400");
      arrowContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;

      dom.appendChild(iconContainer);
      dom.appendChild(contentContainer);
      dom.appendChild(arrowContainer);

      dom.addEventListener("click", () => {
        window.open(url, "_blank", "noopener,noreferrer");
      });

      return {
        dom,
      };
    };
  },
});

function getProviderIcon(provider: CloudStorageProvider): string {
  const icons: Record<CloudStorageProvider, string> = {
    "google-drive": `<svg class="w-6 h-6" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
    </svg>`,
    icloud: `<svg class="w-6 h-6" viewBox="0 0 24 24" fill="#3693F3" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
    </svg>`,
    dropbox: `<svg class="w-6 h-6" viewBox="0 0 24 24" fill="#0061FF" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 6.134L6 9.933l6 3.8 6-3.8-6-3.799zM6 13.933l6 3.8 6-3.8-6-3.8-6 3.8zM6 2l6 3.8 6-3.8-6-3.8L6 2zm0 8.133l-6 3.8 6 3.8 6-3.8-6-3.8zm12 0l-6 3.8 6 3.8 6-3.8-6-3.8zM12 18.266l-6 3.8 6 3.8 6-3.8-6-3.8z"/>
    </svg>`,
    onedrive: `<svg class="w-6 h-6" viewBox="0 0 24 24" fill="#0078D4" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.5 18.5h8.25a3.75 3.75 0 0 0 .75-7.432A5.25 5.25 0 0 0 9.81 8.318 4.5 4.5 0 0 0 5.25 15H6a3 3 0 0 0 0 6h4.5v-2.5z"/>
      <path d="M19.5 11.068A5.251 5.251 0 0 0 9.81 8.318 4.499 4.499 0 0 0 1.5 12a4.478 4.478 0 0 0 1.283 3.143A3.743 3.743 0 0 1 6 12.75h8.25a3.728 3.728 0 0 1 2.145.679A3.749 3.749 0 0 1 19.5 11.068z" opacity=".5"/>
    </svg>`,
    box: `<svg class="w-6 h-6" viewBox="0 0 24 24" fill="#0061D5" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 5A2.5 2.5 0 0 1 5 2.5h14A2.5 2.5 0 0 1 21.5 5v14a2.5 2.5 0 0 1-2.5 2.5H5A2.5 2.5 0 0 1 2.5 19V5zm4 4.5a3 3 0 0 0 0 6h3a3 3 0 0 0 0-6h-3zm6 0a3 3 0 0 0 0 6h3a3 3 0 0 0 0-6h-3z"/>
    </svg>`,
    "yandex-disk": `<svg class="w-6 h-6" viewBox="0 0 24 24" fill="#FFCC00" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
      <path fill="#FF0000" d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
    </svg>`,
    mega: `<svg class="w-6 h-6" viewBox="0 0 24 24" fill="#D9272E" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l7.09 3.54L12 11.27 4.91 7.72 12 4.18zM4 8.82l7 3.5v7.36l-7-3.5V8.82zm16 7.36l-7 3.5v-7.36l7-3.5v7.36z"/>
    </svg>`,
    unknown: `<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>`,
  };

  return `<div class="flex items-center justify-center w-10 h-10 rounded-lg bg-white shadow-sm border">${icons[provider]}</div>`;
}

export default CloudStorageLink;
