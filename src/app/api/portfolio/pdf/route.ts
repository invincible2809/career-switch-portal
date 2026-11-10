import { getCurrentUser } from "@/server/guards";
import { portfolioItems } from "@/server/portfolio";
import { portfolioPdf } from "@/server/pdf/portfolio-pdf";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });
  const pdf = await portfolioPdf(user.displayName, await portfolioItems(user.id));
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="portfolio.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
