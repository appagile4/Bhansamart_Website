// Delivery hubs + address shape. Kept free of imports so redux and components can share it without cycles.
export interface AddressLocation {
  name: string;
  addressLine: string;
  city: string;
  lat: number;
  lng: number;
  nearbyStoresCount?: number;
}

export const PRESET_HUBS: AddressLocation[] = [
  {
    name: "Dwarka Sector 5 Hub",
    addressLine: "Plato 19, Dwarka Sector 5, New Delhi",
    city: "New Delhi",
    lat: 28.5921,
    lng: 77.046,
    nearbyStoresCount: 4,
  },
  {
    name: "Rohini Sector 24 Hub",
    addressLine: "Pocket 24, Rohini Sector 24, Delhi",
    city: "Delhi",
    lat: 28.7212,
    lng: 77.1038,
    nearbyStoresCount: 3,
  },
  {
    name: "Kathmandu Valley Hub",
    addressLine: "Kathmandu Central, Bagmati Province, Nepal",
    city: "Kathmandu",
    lat: 27.7172,
    lng: 85.324,
    nearbyStoresCount: 11,
  },
  {
    name: "Ganga Nagar Hub",
    addressLine: "Main Market, Ganga Nagar, Meerut",
    city: "Meerut",
    lat: 28.9845,
    lng: 77.7064,
    nearbyStoresCount: 1,
  },
];
