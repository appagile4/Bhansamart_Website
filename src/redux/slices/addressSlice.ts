import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AddressLocation, PRESET_HUBS } from "@/components/AddressModal";

interface AddressState {
  currentAddress: AddressLocation;
  isModalOpen: boolean;
}

const initialState: AddressState = {
  currentAddress: PRESET_HUBS[0], // Default: Dwarka Sector 5
  isModalOpen: false,
};

export const addressSlice = createSlice({
  name: "address",
  initialState,
  reducers: {
    setAddress: (state, action: PayloadAction<AddressLocation>) => {
      state.currentAddress = action.payload;
    },
    openAddressModal: (state) => {
      state.isModalOpen = true;
    },
    closeAddressModal: (state) => {
      state.isModalOpen = false;
    },
  },
});

export const { setAddress, openAddressModal, closeAddressModal } =
  addressSlice.actions;

export default addressSlice.reducer;
