import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Circle,
  HelpCircle,
  // Timer,
} from "lucide-react";

export const labels = [
  {
    value: "bug",
    label: "Bug",
  },
  {
    value: "feature",
    label: "Feature",
  },
  {
    value: "documentation",
    label: "Documentation",
  },
];

export const statuses = [
  {
    value: true,
    label: "Опубликовано",
    icon: HelpCircle,
  },
  {
    value: false,
    label: "Черновик",
    icon: Circle,
  },
];

export const priorities = [
  {
    label: "Low",
    value: "low",
    icon: ArrowDown,
  },
  {
    label: "Medium",
    value: "medium",
    icon: ArrowRight,
  },
  {
    label: "High",
    value: "high",
    icon: ArrowUp,
  },
];
