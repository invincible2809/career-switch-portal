import { z } from "zod";
import { applyCode } from "@/server/lab/engine";
import { labApi, readJson } from "@/server/lab/api";

/** POST { code } – applies a discount code. */
export async function POST(request: Request) {
  const parsed = await readJson(request, z.object({ code: z.string().max(30) }));
  if (!parsed.ok) return parsed.response;
  return labApi((state) => applyCode(state, parsed.data.code));
}
