import { catchAllProxy } from "@/lib/backendProxy";

// Proxies /refunds/* to the BhansaMart backend (used by the Seller Hub)
export const { GET, POST, PUT, PATCH, DELETE } = catchAllProxy("/refunds");
