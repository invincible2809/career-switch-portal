import { z } from "zod";
import { placeOrder } from "@/server/lab/engine";
import { labApi, readJson } from "@/server/lab/api";
import { formatPence } from "@/lib/lab/catalogue";

/** POST { name, address, postcode } – places an order (demo shop login needed). */
export async function POST(request: Request) {
  const parsed = await readJson(request, z.object({ name: z.string().max(100), address: z.string().max(300), postcode: z.string().max(20) }));
  if (!parsed.ok) return parsed.response;
  return labApi((state) => {
    const r = placeOrder(state, parsed.data);
    return r.ok ? { ok: true as const, state: r.state, value: { orderRef: r.value!.ref, total: formatPence(r.value!.totalPence) }, message: "Order placed." } : r;
  });
}
