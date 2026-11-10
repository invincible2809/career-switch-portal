import { getCurrentUser } from "@/server/guards";
import { exportUserData } from "@/server/account";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });
  const data = await exportUserData(user.id);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="career-switch-portal-my-data.json"`,
      "Cache-Control": "no-store",
    },
  });
}
