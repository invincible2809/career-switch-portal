import type { Metadata } from "next";
import { db } from "@/server/db";
import { requireAdmin } from "@/server/guards";
import { PageHeader } from "@/components/ui/card";
import { Flash, type FlashParams } from "@/components/admin/flash";
import { setRoleAction } from "../actions";

export const metadata: Metadata = { title: "Users – Admin" };

export default async function UsersPage({ searchParams }: { searchParams: FlashParams }) {
  const admin = await requireAdmin("users:manage");
  const flash = await searchParams;
  // Only what's needed to manage roles (SPEC §13): no learning data here.
  const users = await db.user.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, email: true, displayName: true, role: true, createdAt: true } });
  return (
    <div>
      <PageHeader title="Users" intro="Changing someone's role signs them out so it takes effect straight away." />
      <Flash {...flash} />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-surface text-left">
          <caption className="sr-only">All user accounts</caption>
          <thead>
            <tr>
              <th scope="col" className="border border-border p-2">Name</th>
              <th scope="col" className="border border-border p-2">Email</th>
              <th scope="col" className="border border-border p-2">Joined</th>
              <th scope="col" className="border border-border p-2">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="border border-border p-2">{u.displayName}</td>
                <td className="border border-border p-2 break-all">{u.email}</td>
                <td className="border border-border p-2">{u.createdAt.toLocaleDateString("en-GB")}</td>
                <td className="border border-border p-2">
                  {u.id === admin.id ? (
                    "Admin (you)"
                  ) : (
                    <form action={setRoleAction} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="userId" value={u.id} />
                      <label htmlFor={`role-${u.id}`} className="sr-only">
                        Role for {u.email}
                      </label>
                      <select id={`role-${u.id}`} name="role" defaultValue={u.role} className="min-h-9 rounded-md border border-[#6b7a80] bg-surface px-2">
                        <option value="LEARNER">Learner</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <button type="submit" className="font-semibold text-primary underline">
                        Save
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
