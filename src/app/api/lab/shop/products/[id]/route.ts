import { product } from "@/server/lab/engine";
import { labApi } from "@/server/lab/api";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const p = product(id);
  if (!p) return labApi((state) => ({ ok: false, state, status: 404, error: "That product doesn't exist." }));
  return labApi(() => ({ json: { id: p.id, name: p.name, price: p.priceLabel, stock: p.stock } }));
}
