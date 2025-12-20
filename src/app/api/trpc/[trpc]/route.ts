import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "~/env";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const handler = async (req: NextRequest) => {
  const cookieCollector = NextResponse.next();

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: ({ req: request }) =>
      createTRPCContext({
        headers: request.headers,
        response: cookieCollector,
      }),
    onError:
      env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`
            );
          }
        : undefined,
  });

  const body = await response.text();
  const finalResponse = new NextResponse(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });

  for (const cookie of cookieCollector.cookies.getAll()) {
    finalResponse.cookies.set(cookie);
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[tRPC] response set-cookie:", finalResponse.headers.get("set-cookie"));
  }

  return finalResponse;
};

export { handler as GET, handler as POST };
