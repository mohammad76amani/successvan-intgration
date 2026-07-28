import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGINS = new Set([
    "https://successvanhire.co.uk",
    "https://www.successvanhire.co.uk",
    "http://localhost:8081",
    "http://localhost:8082",
    "http://localhost:19006",
]);

function getAllowedOrigin(origin: string | null) {
    if (!origin) return "*";
    if (ALLOWED_ORIGINS.has(origin)) return origin;
    if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return origin;
    return "https://successvanhire.co.uk";
}

function addCorsHeaders(response: NextResponse, request: NextRequest) {
    response.headers.set(
        "Access-Control-Allow-Origin",
        getAllowedOrigin(request.headers.get("origin")),
    );
    response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    );
    response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization",
    );
    response.headers.set("Access-Control-Max-Age", "86400");
    response.headers.set("Vary", "Origin");
    return response;
}

const gonePathnames = new Set([
    "/2024/01",
    "/2024/01/",
    "/2023/04",
    "/2023/04/",
    "/2023/05",
    "/2023/05/",
    "/2023/12",
    "/2023/12/",
    "/cart-2",
    "/cart-2/",
    "/downloads/your-app-latest.apk",
    "/uploading-documents",
    "/uploading-documents/",
    "/nowrooz-celebrating-the-iraniannew-year",
    "/nowrooz-celebrating-the-iraniannew-year/",
    "/product/luton-with-tail-lift",
    "/product/luton-with-tail-lift/",
]);

export function proxy(request: NextRequest) {
    const { pathname, searchParams } = request.nextUrl;

    if (pathname === "/api" || pathname.startsWith("/api/")) {
        if (request.method === "OPTIONS") {
            return addCorsHeaders(new NextResponse(null, { status: 204 }), request);
        }
        return addCorsHeaders(NextResponse.next(), request);
    }

    // Exact old URLs that should return 410 Gone
    if (gonePathnames.has(pathname)) {
        return new NextResponse("Gone", {
            status: 410,
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
            },
        });
    }

    // Special old WooCommerce add-to-cart URL
    if (pathname === "/cart-2/" && searchParams.get("add-to-cart") === "824") {
        return new NextResponse("Gone", {
            status: 410,
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
            },
        });
    }

    // Special old WooCommerce product attribute URL
    if (
        pathname === "/product/luton-with-tail-lift/" &&
        searchParams.get("attribute_payment-method") === "Reserve/"
    ) {
        return new NextResponse("Gone", {
            status: 410,
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
            },
        });
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/2024/01",
        "/2024/01/",
        "/2023/04",
        "/2023/04/",
        "/2023/05",
        "/2023/05/",
        "/2023/12",
        "/2023/12/",
        "/cart-2",
        "/cart-2/",
        "/downloads/your-app-latest.apk",
        "/uploading-documents",
        "/uploading-documents/",
        "/nowrooz-celebrating-the-iraniannew-year",
        "/nowrooz-celebrating-the-iraniannew-year/",
        "/product/luton-with-tail-lift",
        "/product/luton-with-tail-lift/",
        "/api/:path*",
    ],
};
