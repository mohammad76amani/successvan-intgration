import "server-only";

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/roles";
import { ContractIntegrationError } from "@/lib/docusign/errors";

export type AuthContext = {
  userId: string;
  role: string;
};

function authOrDenied(req: NextRequest) {
  try {
    return requireAuth(req);
  } catch {
    throw new ContractIntegrationError(
      "CONTRACT_ACCESS_DENIED",
      "Unauthorized",
      401,
    );
  }
}

export function requireCustomerAuth(req: NextRequest): AuthContext {
  const auth = authOrDenied(req);
  return { userId: auth.userId, role: auth.role };
}

export function requireAdminAuth(req: NextRequest): AuthContext {
  const auth = authOrDenied(req);
  if (!canAccessDashboard(auth.role)) {
    throw new ContractIntegrationError(
      "CONTRACT_ACCESS_DENIED",
      "Admin access is required.",
      403,
    );
  }
  return { userId: auth.userId, role: auth.role };
}
