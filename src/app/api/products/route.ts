import { NextRequest, NextResponse } from "next/server";
import { ProductItem } from "@/components/ProductCard";

// Fallback products by location in case backend is starting or offline
const LOCATION_FALLBACKS: Record<string, ProductItem[]> = {
  delhi: [
    {
      _id: "p1",
      name: "Amul Salted Butter Golden Paste",
      price: 275,
      originalPrice: 295,
      unit: "500 g",
      category: "Dairy, Bread & Eggs",
      images: [
        {
          url: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80",
          altText: "Amul Salted Butter",
        },
      ],
      ratingsAverage: 4.8,
      ratingsCount: 124,
      inStock: true,
      vendor: {
        businessDetails: { businessName: "Dwarka Sector 5 Supermart" },
        shippingLocations: { city: "New Delhi" },
      },
    },
    {
      _id: "p2",
      name: "Amul Taaza Homogenised Toned Milk",
      price: 54,
      originalPrice: 56,
      unit: "1 Litre Pouch",
      category: "Dairy, Bread & Eggs",
      images: [
        {
          url: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80",
          altText: "Amul Milk",
        },
      ],
      ratingsAverage: 4.9,
      ratingsCount: 310,
      inStock: true,
      vendor: {
        businessDetails: { businessName: "Rohini Fresh Daily Mart" },
        shippingLocations: { city: "Delhi" },
      },
    },
    {
      _id: "p3",
      name: "Farm Fresh Green Capsicum / Shimla Mirch",
      price: 70,
      originalPrice: 90,
      unit: "500 g",
      category: "Fruits & Vegetables",
      images: [
        {
          url: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&auto=format&fit=crop&q=80",
          altText: "Green Capsicum",
        },
      ],
      ratingsAverage: 4.7,
      ratingsCount: 88,
      inStock: true,
      vendor: {
        businessDetails: { businessName: "Sector 24 Organic & Grocery Superstore" },
        shippingLocations: { city: "Delhi" },
      },
    },
    {
      _id: "p4",
      name: "Fresh Hybrid Red Tomatoes (Rohini Farm)",
      price: 45,
      originalPrice: 70,
      unit: "1 kg",
      category: "Fruits & Vegetables",
      images: [
        {
          url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80",
          altText: "Fresh Tomatoes",
        },
      ],
      ratingsAverage: 4.6,
      ratingsCount: 154,
      inStock: true,
      vendor: {
        businessDetails: { businessName: "Rohini Fresh Daily Mart" },
        shippingLocations: { city: "Delhi" },
      },
    },
    {
      _id: "p5",
      name: "Fortune Kachi Ghani Pure Mustard Oil",
      price: 165,
      originalPrice: 190,
      unit: "1 Litre Bottle",
      category: "Masala, Oil & More",
      images: [
        {
          url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80",
          altText: "Mustard Oil",
        },
      ],
      ratingsAverage: 4.8,
      ratingsCount: 92,
      inStock: true,
      vendor: {
        businessDetails: { businessName: "Dwarka Sector 5 Supermart" },
        shippingLocations: { city: "New Delhi" },
      },
    },
    {
      _id: "p6",
      name: "Tata Sampann High Protein Yellow Arhar Dal",
      price: 195,
      originalPrice: 220,
      unit: "1 kg Pack",
      category: "Atta, Rice & Dal",
      images: [
        {
          url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
          altText: "Tata Arhar Dal",
        },
      ],
      ratingsAverage: 4.9,
      ratingsCount: 205,
      inStock: true,
      vendor: {
        businessDetails: { businessName: "Aggarwal Sweets & Quick Snacks" },
        shippingLocations: { city: "Delhi" },
      },
    },
    {
      _id: "p7",
      name: "Premium Royal Delicious Apples (Shimla)",
      price: 240,
      originalPrice: 280,
      unit: "1 kg (4-5 pcs)",
      category: "Fruits & Vegetables",
      images: [
        {
          url: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80",
          altText: "Shimla Apples",
        },
      ],
      ratingsAverage: 4.8,
      ratingsCount: 167,
      inStock: true,
      vendor: {
        businessDetails: { businessName: "Dwarka Sector 5 Supermart" },
        shippingLocations: { city: "New Delhi" },
      },
    },
    {
      _id: "p8",
      name: "Pure Desi Cow Ghee Golden Aroma",
      price: 950,
      originalPrice: 1100,
      unit: "1 Litre Jar",
      category: "Masala, Oil & More",
      images: [
        {
          url: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&auto=format&fit=crop&q=80",
          altText: "Pure Desi Ghee",
        },
      ],
      ratingsAverage: 4.9,
      ratingsCount: 142,
      inStock: true,
      vendor: {
        businessDetails: { businessName: "Sector 24 Organic & Grocery Superstore" },
        shippingLocations: { city: "Delhi" },
      },
    },
  ],
  kathmandu: [
    {
      _id: "k1",
      name: "Annapurna Fresh Farm Organic Tomatoes",
      price: 75,
      originalPrice: 90,
      unit: "1 kg",
      category: "Fruits & Vegetables",
      images: [
        {
          url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80",
          altText: "Organic Tomatoes",
        },
      ],
      ratingsAverage: 4.7,
      ratingsCount: 54,
      inStock: true,
      vendor: {
        businessDetails: { businessName: "Annapurna Organics & Kitchen Hub" },
        shippingLocations: { city: "Kathmandu" },
      },
    },
    {
      _id: "k2",
      name: "Himalayan Premium Sharbati Whole Wheat Atta",
      price: 450,
      originalPrice: 500,
      unit: "5 kg Bag",
      category: "Atta, Rice & Dal",
      images: [
        {
          url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
          altText: "Wheat Atta",
        },
      ],
      ratingsAverage: 4.9,
      ratingsCount: 95,
      inStock: true,
      vendor: {
        businessDetails: { businessName: "Kathmandu Fresh Dairy & Staples" },
        shippingLocations: { city: "Kathmandu" },
      },
    },
    {
      _id: "k3",
      name: "Kathmandu Dairy Fresh Full Cream Milk",
      price: 60,
      originalPrice: 65,
      unit: "1 Litre Bottle",
      category: "Dairy, Bread & Eggs",
      images: [
        {
          url: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80",
          altText: "Full Cream Milk",
        },
      ],
      ratingsAverage: 4.8,
      ratingsCount: 110,
      inStock: true,
      vendor: {
        businessDetails: { businessName: "Kathmandu Fresh Dairy" },
        shippingLocations: { city: "Kathmandu" },
      },
    },
    {
      _id: "k4",
      name: "Traditional Yellow Moong Dal",
      price: 180,
      originalPrice: 200,
      unit: "1 kg Pack",
      category: "Atta, Rice & Dal",
      images: [
        {
          url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
          altText: "Moong Dal",
        },
      ],
      ratingsAverage: 4.7,
      ratingsCount: 42,
      inStock: true,
      vendor: {
        businessDetails: { businessName: "Annapurna Organics & Kitchen Hub" },
        shippingLocations: { city: "Kathmandu" },
      },
    },
  ],
};

export async function GET(req: NextRequest) {
  const backendUrl =
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://bhansamart.webstudiomatrix.com/api";
  const { searchParams } = new URL(req.url);

  const lat = searchParams.get("lat") || searchParams.get("latitude");
  const lng = searchParams.get("lng") || searchParams.get("longitude");
  const city = searchParams.get("city") || "";
  const category = searchParams.get("category") || "";
  const subCategory = searchParams.get("subCategory") || "";
  const search = searchParams.get("search") || "";
  const limit = searchParams.get("limit") || "100";

  // 1. Try to fetch from active Express Backend
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const params = new URLSearchParams(searchParams);
    if (!params.has("limit")) {
      params.set("limit", limit);
    }
    const targetUrl = `${backendUrl}/products?${params.toString()}`;

    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 30 },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        return NextResponse.json({
          ...data,
          source: "backend",
        });
      }
    }
  } catch {
    // If backend isn't actively reachable, smoothly serve fallback by address
  }

  // 2. Fallback resolution based on coordinates/city
  let selectedFallback = LOCATION_FALLBACKS.delhi;
  const lowerCity = city.toLowerCase();
  const numLat = parseFloat(lat || "0");
  const numLng = parseFloat(lng || "0");

  if (
    lowerCity.includes("kathmandu") ||
    lowerCity.includes("lalitpur") ||
    lowerCity.includes("nepal") ||
    (numLat >= 27.6 && numLat <= 27.8 && numLng >= 85.2 && numLng <= 85.4)
  ) {
    selectedFallback = LOCATION_FALLBACKS.kathmandu;
  }

  // Optional category filter
  let filtered = [...selectedFallback];
  if (category && category !== "all" && category !== "All") {
    filtered = filtered.filter(
      (p) => p.category?.toLowerCase().includes(category.toLowerCase())
    );
  }

  // Optional subCategory filter
  if (subCategory && subCategory !== "all" && subCategory !== "All") {
    filtered = filtered.filter(
      (p) => p.subCategory?.toLowerCase().includes(subCategory.toLowerCase())
    );
  }

  // Optional search filter
  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
    );
  }

  return NextResponse.json({
    success: true,
    source: "fallback",
    count: filtered.length,
    total: filtered.length,
    eligibleVendorsCount: selectedFallback === LOCATION_FALLBACKS.kathmandu ? 11 : 4,
    isOutsideDeliveryZone: false,
    products: filtered,
  });
}
