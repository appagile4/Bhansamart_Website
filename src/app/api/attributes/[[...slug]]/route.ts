import { catchAllProxy } from "@/lib/backendProxy";

// Proxies /attributes/* to the BhansaMart backend (used by the Seller Hub)
export const { GET, POST, PUT, PATCH, DELETE } = catchAllProxy("/attributes");
