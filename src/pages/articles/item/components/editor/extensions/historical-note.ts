import { Node, mergeAttributes } from "@tiptap/core";

export interface HistoricalNoteOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    historicalNote: {
      setHistoricalNote: () => ReturnType;
      toggleHistoricalNote: () => ReturnType;
    };
  }
}

export const HistoricalNote = Node.create<HistoricalNoteOptions>({
  name: "historicalNote",

  group: "block",

  content: "block+",

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="historical-note"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "historical-note",
        class: "historical-note",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setHistoricalNote:
        () =>
        ({ commands }) => {
          return commands.wrapIn(this.name);
        },
      toggleHistoricalNote:
        () =>
        ({ commands }) => {
          return commands.toggleWrap(this.name);
        },
    };
  },
});

export default HistoricalNote;
