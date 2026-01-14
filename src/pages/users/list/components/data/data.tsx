import {
  IconShieldCheckFilled,
  IconUser,
  IconCircleCheckFilled,
  IconForbid2Filled,
} from "@tabler/icons-react";

export const roles = [
  {
    value: "ADMIN",
    label: "Администратор",
    icon: IconShieldCheckFilled,
  },
  {
    value: "USER",
    label: "Пользователь",
    icon: IconUser,
  },
];

export const statuses = [
  {
    value: "true",
    label: "Активен",
    icon: IconCircleCheckFilled,
  },
  {
    value: "false",
    label: "Заблокирован",
    icon: IconForbid2Filled,
  },
];
