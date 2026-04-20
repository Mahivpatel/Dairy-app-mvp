import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/customers/:path*",
    "/api/purchases/:path*",
    "/api/ledgers/:path*",
    "/api/scan",
  ],
};