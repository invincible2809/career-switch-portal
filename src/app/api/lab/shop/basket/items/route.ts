import { z } from "zod";
import { setQuantity } from "@/server/lab/engine";
import { labApi, readJson } from "@/server/lab/api";

const body = z.object({ productId: z.string().max(50), quantity: z.union([z.number(), z.string().max(20)]) });

/** POST { productId, quantity } – sets the quantity of an item in the basket. */
export async function POST(request: Request) {
  const parsed = await readJson(request, body);
  if (!parsed.ok) return parsed.response;
  return labApi((state) => {
    const r = setQuantity(state, parsed.data.productId, parsed.data.quantity);
    return r.ok ? { ...r, message: "Basket updated." } : r;
  });
}
