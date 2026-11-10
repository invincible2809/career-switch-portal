import { z } from "zod";
import { login } from "@/server/lab/engine";
import { labApi, readJson } from "@/server/lab/api";

/** POST { email, password } – logs in to the demo shop (not the portal). */
export async function POST(request: Request) {
  const parsed = await readJson(request, z.object({ email: z.string().max(200), password: z.string().max(200) }));
  if (!parsed.ok) return parsed.response;
  return labApi((state) => {
    const r = login(state, parsed.data.email, parsed.data.password);
    return r.ok ? { ...r, message: "Logged in to the demo shop." } : r;
  });
}
