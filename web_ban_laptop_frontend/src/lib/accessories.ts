import {
  Mouse,
  Keyboard,
  Headphones,
  Square,
  Laptop2,
  Briefcase,
  Plug,
  type LucideIcon,
} from "lucide-react";
import { gradientFor } from "@/lib/products";

export type AccessoryCategory = "Chuột" | "Bàn phím" | "Tai nghe" | "Giá đỡ" | "Sạc laptop";

export interface Accessory {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: AccessoryCategory;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  badge?: "Mới" | "Bán chạy" | "Flash Sale";
  description: string;
  seed: string;
}

export const accessoryCategories: { key: AccessoryCategory; icon: LucideIcon; desc: string }[] = [
  { key: "Chuột", icon: Mouse, desc: "Có dây & không dây" },
  { key: "Bàn phím", icon: Keyboard, desc: "Cơ, màng, cao cấp" },
  { key: "Tai nghe", icon: Headphones, desc: "Over-ear, in-ear" },
  { key: "Giá đỡ", icon: Laptop2, desc: "Nhôm, gập, nâng tầm mắt" },
  { key: "Sạc laptop", icon: Plug, desc: "USB-C, GaN, 65–100W" },
];

export const accessories: Accessory[] = [];

export function getAccessoryBySlug(slug: string) {
  return accessories.find((a) => a.slug === slug);
}

export function accessoryGradient(seed: string) {
  return gradientFor(seed);
}
