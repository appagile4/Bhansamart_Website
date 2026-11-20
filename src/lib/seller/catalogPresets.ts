/** Product form presets — copied from the app's addProduct.tsx so both clients offer the same options. */
import { getSubCategoriesForCategory } from "@/lib/constants/categories";

export const SUPPLIER_OPTIONS = [
  "Bhansa Direct Wholesalers",
  "Himalayan Organic Farms",
  "Valley Agro Suppliers",
  "Nepal Agri Distributors",
  "Kathmandu Grocery Hub",
];

export const DISCOUNT_CATEGORIES = [
  "No Discount",
  "Flat Amount Discount",
  "Percentage Discount",
  "Flash Deal Special",
  "Seasonal Harvest Discount",
];

export const WEIGHT_UNITS = ["kg", "g", "Ltr", "ml", "Pcs", "Pack", "Box"];

export const GENERIC_BRAND = "Generic / Store Brand";

/** Curated well-known brands per category (app: DEFAULT_CATEGORY_BRANDS); shown alongside approved DB brands. */
export const PRESET_BRANDS: Record<string, Array<{ name: string; logo: string }>> = {
  "Grocery & Kitchen": [
    { name: "Amul", logo: "https://logo.clearbit.com/amul.com" },
    { name: "Nestle", logo: "https://logo.clearbit.com/nestle.com" },
    { name: "Tata Sampann", logo: "https://logo.clearbit.com/tataconsumer.com" },
    { name: "Dabur", logo: "https://logo.clearbit.com/dabur.com" },
    { name: "Everest", logo: "https://logo.clearbit.com/everestspices.com" },
    { name: "Fortune", logo: "https://logo.clearbit.com/fortunefoods.com" },
    { name: "Aashirvaad", logo: "https://logo.clearbit.com/itcportal.com" },
  ],
  "Snacks & Drinks": [
    { name: "Lay's", logo: "https://logo.clearbit.com/lays.com" },
    { name: "Haldiram's", logo: "https://logo.clearbit.com/haldirams.com" },
    { name: "Cadbury", logo: "https://logo.clearbit.com/cadbury.co.uk" },
    { name: "Coca-Cola", logo: "https://logo.clearbit.com/coca-cola.com" },
    { name: "Pepsi", logo: "https://logo.clearbit.com/pepsi.com" },
    { name: "Amul", logo: "https://logo.clearbit.com/amul.com" },
  ],
  "Beauty & Personal Care": [
    { name: "Nivea", logo: "https://logo.clearbit.com/nivea.com" },
    { name: "L'Oreal", logo: "https://logo.clearbit.com/loreal.com" },
    { name: "Himalaya", logo: "https://logo.clearbit.com/himalayawellness.com" },
    { name: "Dettol", logo: "https://logo.clearbit.com/dettol.co.uk" },
    { name: "Dabur", logo: "https://logo.clearbit.com/dabur.com" },
  ],
  Baby: [
    { name: "Pampers", logo: "https://logo.clearbit.com/pampers.com" },
    { name: "Johnson's Baby", logo: "https://logo.clearbit.com/johnsonsbaby.com" },
    { name: "Himalaya", logo: "https://logo.clearbit.com/himalayawellness.com" },
    { name: "Nestle", logo: "https://logo.clearbit.com/nestle.com" },
  ],
  "School, Office & Stationery": [
    { name: "Classmate", logo: "https://logo.clearbit.com/classmateshop.com" },
    { name: "Camlin", logo: "https://logo.clearbit.com/kokuyocamlin.com" },
    { name: "Faber-Castell", logo: "https://logo.clearbit.com/faber-castell.com" },
  ],
};

/** Sub-categories for a category, with display line-breaks removed */
export const subCategoriesFor = (category: string) =>
  getSubCategoriesForCategory(category).map((s) => s.replace(/\n/g, " "));

export const generateSku = (category: string) =>
  `BM-${(category || "PROD").replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
