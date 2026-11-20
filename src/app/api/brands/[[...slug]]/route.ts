import { catchAllProxy } from "@/lib/backendProxy";

// Proxies /brands/* to the BhansaMart backend (used by the Seller Hub)
export const { GET, POST, PUT, PATCH, DELETE } = catchAllProxy("/brands");
