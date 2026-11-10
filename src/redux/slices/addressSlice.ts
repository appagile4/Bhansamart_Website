import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AddressLocation, PRESET_HUBS } from "@/components/AddressModal";

const ADDRESS_STORAGE_KEY = "bhansa_selected_address";

export const loadStoredAddress = (): AddressLocation => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(ADDRESS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          parsed &&
          parsed.addressLine &&
          !parsed.addressLine.includes("GPS") &&
          typeof parsed.lat === "number" &&
          typeof parsed.lng === "number"
        ) {
          return parsed;
        }
      }
    } catch {}
  }
  return PRESET_HUBS[0];
};

export const saveAddressToStorage = (addr: AddressLocation) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(addr));
    } catch {}
  }
};

interface AddressState {
  currentAddress: AddressLocation;
  isModalOpen: boolean;
}

const initialState: AddressState = {
  currentAddress: PRESET_HUBS[0],
  isModalOpen: false,
};

export const addressSlice = createSlice({
  name: "address",
  initialState,
  reducers: {
    initializeAddress: (state) => {
      const stored = loadStoredAddress();
      state.currentAddress = stored;
    },
    setAddress: (state, action: PayloadAction<AddressLocation>) => {
      const addr = { ...action.payload };
      if (!addr.addressLine || addr.addressLine.includes("GPS")) {
        addr.addressLine = "Plato 19, Dwarka Sector 5, New Delhi";
        addr.name = "Current Location";
      }
      state.currentAddress = addr;
      saveAddressToStorage(addr);
    },
    openAddressModal: (state) => {
      state.isModalOpen = true;
    },
    closeAddressModal: (state) => {
      state.isModalOpen = false;
    },
  },
});

export const {
  initializeAddress,
  setAddress,
  openAddressModal,
  closeAddressModal,
} = addressSlice.actions;

export default addressSlice.reducer;
