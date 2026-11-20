import { catchAllProxy } from "@/lib/backendProxy";

// Proxies /api/admin/* to the BhansaMart backend (Super Admin console)
export const { GET, POST, PUT, PATCH, DELETE } = catchAllProxy("/admin");
