/**
 * Centralized BhansaMart Categories and Sub-Categories Configuration
 * Exact mirror of customer panel in Frontend/src/app/customerMain/category.tsx
 * and Frontend/src/constants/categories.ts
 */

export interface CategoryCardData {
  id: string;
  name: string;
  imageUrl: string;
  slug?: string;
  categoryTitle?: string;
}

export interface SectionCategoryData {
  id: string;
  title: string;
  badge?: string;
  iconName?: string;
  imageUrl?: string;
  items: CategoryCardData[];
}

export const ALL_CATEGORY_SECTIONS: SectionCategoryData[] = [
  {
    id: "paan-corner",
    title: "Paan Corner",
    badge: "Paan Corner essentials delivered in 15-25 minutes",
    imageUrl: "/images/categories/paan-corner.png",
    items: [
      {
        id: "lighter",
        name: "Lighter",
        slug: "lighter",
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTmwCTsFRk-O5VHZzcm0FCrqeuLfBzkbkR-cYrxJq9Y9YGrHXMtgdwMrlfL&s=10",
        categoryTitle: "Paan Corner",
      },
    ],
  },
  {
    id: "grocery-kitchen",
    title: "Grocery & Kitchen",
    badge: "Daily Staples",
    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80",
    items: [
      {
        id: "veg-fruits",
        name: "Vegetables & Fruits",
        slug: "vegetables-fruits",
        imageUrl:
          "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=80",
      },
      {
        id: "atta-rice-dal",
        name: "Atta, Rice & Dal",
        slug: "atta-rice-dal",
        imageUrl:
          "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80",
      },
      {
        id: "oil-ghee-masala",
        name: "Oil, Ghee & Masala",
        slug: "oil-ghee-masala",
        imageUrl:
          "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80",
      },
      {
        id: "dairy-bread-eggs",
        name: "Dairy, Bread & Eggs",
        slug: "dairy-bread-eggs",
        imageUrl:
          "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80",
      },
      {
        id: "bakery-biscuits",
        name: "Bakery & Biscuits",
        slug: "bakery-biscuits",
        imageUrl:
          "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80",
      },
      {
        id: "dry-fruits-cereals",
        name: "Dry Fruits & Cereals",
        slug: "dry-fruits-cereals",
        imageUrl:
          "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80",
      },
      {
        id: "chicken-meat-fish",
        name: "Chicken, Meat & Fish",
        slug: "chicken-meat-fish",
        imageUrl:
          "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80",
      },
      {
        id: "kitchenware-appliances",
        name: "Kitchenware & Appliances",
        slug: "kitchenware-appliances",
        imageUrl:
          "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400&q=80",
      },
    ],
  },
  {
    id: "snacks-drinks",
    title: "Snacks & Drinks",
    badge: "Quick Bites",
    imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&q=80",
    items: [
      {
        id: "chips-nachos-popcorn",
        name: "Chips, Nachos & Popcorn",
        slug: "chips-nachos-popcorn",
        imageUrl:
          "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80",
      },
      {
        id: "namkeen-roasted-snacks",
        name: "Namkeen & Roasted",
        slug: "namkeen-roasted",
        imageUrl:
          "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80",
      },
      {
        id: "biscuits-cookies-wafers",
        name: "Biscuits & Cookies",
        slug: "biscuits-cookies",
        imageUrl:
          "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80",
      },
      {
        id: "chocolates-candies-toffees",
        name: "Chocolates & Candies",
        slug: "chocolates-candies",
        imageUrl:
          "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&q=80",
      },
      {
        id: "dryfruits-nuts-seeds",
        name: "Dry Fruits & Nuts",
        slug: "dry-fruits-nuts",
        imageUrl:
          "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80",
      },
      {
        id: "snackbars-healthy-bites",
        name: "Snack Bars & Healthy Bites",
        slug: "snackbars-healthy-bites",
        imageUrl:
          "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&q=80",
      },
      {
        id: "instant-noodles-pasta",
        name: "Instant Noodles & Pasta",
        slug: "instant-noodles-pasta",
        imageUrl:
          "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&q=80",
      },
      {
        id: "cold-drinks-icecream",
        name: "Cold Drinks & Ice Cream",
        slug: "cold-drinks-icecream",
        imageUrl:
          "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&q=80",
      },
    ],
  },
  {
    id: "beauty-personal-care",
    title: "Beauty & Personal Care",
    badge: "Self Care",
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80",
    items: [
      {
        id: "bath-body",
        name: "Bath & Body",
        slug: "bath-body",
        imageUrl:
          "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80",
      },
      {
        id: "hair",
        name: "Hair Care",
        slug: "hair-care",
        imageUrl:
          "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80",
      },
      {
        id: "skin-faces",
        name: "Skin & Faces",
        slug: "skin-faces",
        imageUrl:
          "https://images.unsplash.com/photo-1556228722-d0b5ed7cd88c?w=400&q=80",
      },
      {
        id: "beauty-cosmetics",
        name: "Beauty & Cosmetics",
        slug: "beauty-cosmetics",
        imageUrl:
          "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&q=80",
      },
      {
        id: "feminine-hygiene",
        name: "Feminine Hygiene",
        slug: "feminine-hygiene",
        imageUrl:
          "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80",
      },
      {
        id: "fragrances-deodorants",
        name: "Fragrances & Deodorants",
        slug: "fragrances-deodorants",
        imageUrl:
          "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&q=80",
      },
      {
        id: "health-pharma",
        name: "Health & Pharma",
        slug: "health-pharma",
        imageUrl:
          "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80",
      },
      {
        id: "sexual-wellness",
        name: "Sexual Wellness",
        slug: "sexual-wellness",
        imageUrl:
          "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&q=80",
      },
    ],
  },
  {
    id: "baby",
    title: "Baby",
    badge: "Baby Care",
    imageUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500&q=80",
    items: [
      {
        id: "baby-food",
        name: "Baby Food",
        slug: "baby-food",
        imageUrl:
          "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&q=80",
      },
      {
        id: "diapers-pants",
        name: "Diapers & Pants",
        slug: "diapers-pants",
        imageUrl:
          "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&q=80",
      },
      {
        id: "baby-care",
        name: "Baby Care",
        slug: "baby-care",
        imageUrl:
          "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&q=80",
      },
      {
        id: "baby-bath",
        name: "Baby Bath",
        slug: "baby-bath",
        imageUrl:
          "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80",
      },
      {
        id: "baby-feeding",
        name: "Baby Feeding",
        slug: "baby-feeding",
        imageUrl:
          "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&q=80",
      },
      {
        id: "baby-clothing",
        name: "Baby Clothing",
        slug: "baby-clothing",
        imageUrl:
          "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&q=80",
      },
      {
        id: "baby-accessories",
        name: "Baby Accessories",
        slug: "baby-accessories",
        imageUrl:
          "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&q=80",
      },
      {
        id: "baby-toys",
        name: "Baby Toys",
        slug: "baby-toys",
        imageUrl:
          "https://images.unsplash.com/photo-1599623560574-39d485900c95?w=400&q=80",
      },
    ],
  },
  {
    id: "school-office-stationery",
    title: "School, Office & Stationery",
    badge: "Stationery",
    imageUrl: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&q=80",
    items: [
      {
        id: "pens-pencils",
        name: "Pens & Pencils",
        slug: "pens-pencils",
        imageUrl:
          "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&q=80",
      },
      {
        id: "notebooks-diaries",
        name: "Notebooks & Diaries",
        slug: "notebooks-diaries",
        imageUrl:
          "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80",
      },
      {
        id: "markers-highlighters",
        name: "Markers & Highlighters",
        slug: "markers-highlighters",
        imageUrl:
          "https://images.unsplash.com/photo-1585336261026-7fcfbdfa95b8?w=400&q=80",
      },
      {
        id: "geometry-scales",
        name: "Geometry & Scales",
        slug: "geometry-scales",
        imageUrl:
          "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80",
      },
      {
        id: "art-craft-supplies",
        name: "Art & Craft Supplies",
        slug: "art-craft-supplies",
        imageUrl:
          "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=80",
      },
      {
        id: "files-folders",
        name: "Files & Folders",
        slug: "files-folders",
        imageUrl:
          "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80",
      },
      {
        id: "office-desk-supplies",
        name: "Office & Desk Supplies",
        slug: "office-desk-supplies",
        imageUrl:
          "https://images.unsplash.com/photo-1507842229451-79b1be886a20?w=400&q=80",
      },
      {
        id: "printer-paper-labels",
        name: "Printer Paper & Labels",
        slug: "printer-paper-labels",
        imageUrl:
          "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&q=80",
      },
    ],
  },
  {
    id: "gifting",
    title: "Gifting",
    badge: "Presents & Hampers",
    imageUrl: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=500&q=80",
    items: [
      {
        id: "chocolates-sweets",
        name: "Chocolates & Sweets",
        slug: "chocolates-sweets",
        imageUrl:
          "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&q=80",
      },
      {
        id: "mens-wear",
        name: "Men's Wear",
        slug: "mens-wear",
        imageUrl:
          "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400&q=80",
      },
      {
        id: "womens-wear",
        name: "Women's Wear",
        slug: "womens-wear",
        imageUrl:
          "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&q=80",
      },
      {
        id: "dresses-ethnic",
        name: "Dresses & Ethnic",
        slug: "dresses-ethnic",
        imageUrl:
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80",
      },
      {
        id: "cosmetics-hampers",
        name: "Cosmetics & Hampers",
        slug: "cosmetics-hampers",
        imageUrl:
          "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&q=80",
      },
      {
        id: "electronics-gadgets",
        name: "Electronics & Gadgets",
        slug: "electronics-gadgets",
        imageUrl:
          "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80",
      },
      {
        id: "toys-games",
        name: "Toys & Games",
        slug: "toys-games",
        imageUrl:
          "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=400&q=80",
      },
      {
        id: "kids-baby-gifts",
        name: "Kids & Baby Gifts",
        slug: "kids-baby-gifts",
        imageUrl:
          "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&q=80",
      },
    ],
  },
  {
    id: "fruits-vegetables",
    title: "Fruits & Vegetables",
    badge: "Farm fresh organic fruits & green vegetables",
    imageUrl: "/images/categories/fruits-vegetables.png",
    items: [
      { id: "fresh-vegetables", name: "Fresh Vegetables", slug: "fresh-vegetables", imageUrl: "/images/categories/fruits-vegetables.png" },
      { id: "fresh-fruits", name: "Fresh Fruits", slug: "fresh-fruits", imageUrl: "/images/categories/fruits-vegetables.png" },
    ],
  },
  {
    id: "cold-drinks-juices",
    title: "Cold Drinks & Juices",
    badge: "Chilled soft drinks, sodas & fruit juices",
    imageUrl: "/images/categories/cold-drinks-juices.png",
    items: [
      { id: "soft-drinks", name: "Soft Drinks", slug: "soft-drinks", imageUrl: "/images/categories/cold-drinks-juices.png" },
      { id: "juices", name: "Fruit Juices", slug: "juices", imageUrl: "/images/categories/cold-drinks-juices.png" },
    ],
  },
  {
    id: "dairy-bread-eggs",
    title: "Dairy, Bread & Eggs",
    badge: "Fresh milk, bread, butter & eggs",
    imageUrl: "/images/categories/dairy-bread-eggs.png",
    items: [
      { id: "milk", name: "Milk", slug: "milk", imageUrl: "/images/categories/dairy-bread-eggs.png" },
      { id: "bread-pav", name: "Bread & Pav", slug: "bread-pav", imageUrl: "/images/categories/dairy-bread-eggs.png" },
      { id: "eggs", name: "Eggs", slug: "eggs", imageUrl: "/images/categories/dairy-bread-eggs.png" },
    ],
  },
  {
    id: "snacks-munchies",
    title: "Snacks & Munchies",
    badge: "Chips, namkeen, wafers & party snacks",
    imageUrl: "/images/categories/snacks-munchies.png",
    items: [
      { id: "chips-crisps", name: "Chips & Crisps", slug: "chips-crisps", imageUrl: "/images/categories/snacks-munchies.png" },
      { id: "namkeen", name: "Namkeen", slug: "namkeen", imageUrl: "/images/categories/snacks-munchies.png" },
    ],
  },
  {
    id: "sweet-tooth",
    title: "Sweet Tooth",
    badge: "Chocolates, mithai, desserts & ice creams",
    imageUrl: "/images/categories/sweet-tooth.png",
    items: [
      { id: "chocolates", name: "Chocolates", slug: "chocolates", imageUrl: "/images/categories/sweet-tooth.png" },
      { id: "mithai", name: "Mithai", slug: "mithai", imageUrl: "/images/categories/sweet-tooth.png" },
    ],
  },
  {
    id: "bakery-biscuits",
    title: "Bakery & Biscuits",
    badge: "Cookies, rusks, cakes & artisan breads",
    imageUrl: "/images/categories/bakery-biscuits.png",
    items: [
      { id: "cookies", name: "Cookies", slug: "cookies", imageUrl: "/images/categories/bakery-biscuits.png" },
      { id: "cakes", name: "Cakes", slug: "cakes", imageUrl: "/images/categories/bakery-biscuits.png" },
    ],
  },
  {
    id: "tea-coffee-milk-drinks",
    title: "Tea, Coffee & Milk Drinks",
    badge: "Premium tea, coffee beans & health drinks",
    imageUrl: "/images/categories/tea-coffee-milk-drinks.png",
    items: [
      { id: "tea", name: "Tea", slug: "tea", imageUrl: "/images/categories/tea-coffee-milk-drinks.png" },
      { id: "coffee", name: "Coffee", slug: "coffee", imageUrl: "/images/categories/tea-coffee-milk-drinks.png" },
    ],
  },
  {
    id: "atta-rice-dal",
    title: "Atta, Rice & Dal",
    badge: "Grains, flours, pulses & daily essentials",
    imageUrl: "/images/categories/atta-rice-dal.png",
    items: [
      { id: "atta", name: "Atta", slug: "atta", imageUrl: "/images/categories/atta-rice-dal.png" },
      { id: "rice", name: "Rice", slug: "rice", imageUrl: "/images/categories/atta-rice-dal.png" },
      { id: "dal-pulses", name: "Dal & Pulses", slug: "dal-pulses", imageUrl: "/images/categories/atta-rice-dal.png" },
    ],
  },
  {
    id: "masala-oil-more",
    title: "Masala, Oil & More",
    badge: "Cooking oils, pure ghee & aromatic spices",
    imageUrl: "/images/categories/masala-oil-more.png",
    items: [
      { id: "edible-oils", name: "Edible Oils", slug: "edible-oils", imageUrl: "/images/categories/masala-oil-more.png" },
      { id: "ghee", name: "Ghee", slug: "ghee", imageUrl: "/images/categories/masala-oil-more.png" },
      { id: "spices-masalas", name: "Spices & Masalas", slug: "spices-masalas", imageUrl: "/images/categories/masala-oil-more.png" },
    ],
  },
  {
    id: "cleaning-essentials",
    title: "Cleaning Essentials",
    badge: "Detergents, floor cleaners & home hygiene",
    imageUrl: "/images/categories/cleaning-essentials.png",
    items: [
      { id: "detergents", name: "Detergents", slug: "detergents", imageUrl: "/images/categories/cleaning-essentials.png" },
      { id: "dishwash", name: "Dishwash", slug: "dishwash", imageUrl: "/images/categories/cleaning-essentials.png" },
    ],
  },
  {
    id: "personal-care",
    title: "Personal Care",
    badge: "Soaps, shampoos, skincare & grooming essentials",
    imageUrl: "/images/categories/personal-care.png",
    items: [
      { id: "skin-care", name: "Skin Care", slug: "skin-care", imageUrl: "/images/categories/personal-care.png" },
      { id: "hair-care", name: "Hair Care", slug: "hair-care", imageUrl: "/images/categories/personal-care.png" },
    ],
  },
  {
    id: "pet-care",
    title: "Pet Care",
    badge: "Pet food, treats, toys & grooming products",
    imageUrl: "/images/categories/pet-care.png",
    items: [
      { id: "dog-food", name: "Dog Food", slug: "dog-food", imageUrl: "/images/categories/pet-care.png" },
      { id: "cat-food", name: "Cat Food", slug: "cat-food", imageUrl: "/images/categories/pet-care.png" },
    ],
  },
];

// Flat list of category names matching backend
export const MAIN_CATEGORY_NAMES: string[] = ALL_CATEGORY_SECTIONS.map((c) => c.title);

// Flat list of all category cards with section metadata
export const ALL_CATEGORY_ITEMS: CategoryCardData[] = ALL_CATEGORY_SECTIONS.flatMap(
  (sec) =>
    sec.items.map((item) => ({
      ...item,
      categoryTitle: sec.title,
    }))
);

export const getSubCategoriesForCategory = (categoryTitle: string): string[] => {
  const section = ALL_CATEGORY_SECTIONS.find(
    (s) => s.title.toLowerCase() === categoryTitle.toLowerCase()
  );
  return section ? section.items.map((i) => i.name) : [];
};
