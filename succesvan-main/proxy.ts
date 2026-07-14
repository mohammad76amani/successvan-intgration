import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
    ],
};