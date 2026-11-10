"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireLearner } from "@/server/guards";
import { loadLab, resetLab, saveLab } from "@/server/lab/session";
import { addToBasket, applyCode, login, logout, placeOrder, removeFromBasket, setQuantity, type Result } from "@/server/lab/engine";
import { formatPence } from "@/lib/lab/catalogue";

export interface LabFormState {
  ok?: string;
  error?: string;
  at?: number;
}

const str = (f: FormData, k: string, max = 300) => String(f.get(k) ?? "").slice(0, max);

/** One action for every demo-shop form, selected by the hidden "op" field. */
export async function labShopAction(_prev: LabFormState, formData: FormData): Promise<LabFormState> {
  const user = await requireLearner();
  const op = z.enum(["login", "logout", "add", "qty", "remove", "code", "order"]).parse(formData.get("op"));
  const lab = await loadLab(user.id);
  let r: Result<{ ref: string; totalPence: number }>;
  switch (op) {
    case "login":
      r = login(lab.state, str(formData, "email"), str(formData, "password"));
      if (r.ok) r = { ...r, message: "You're logged in to the demo shop." };
      break;
    case "logout":
      r = { ok: true, state: logout(lab.state), message: "Logged out of the demo shop." };
      break;
    case "add":
      r = addToBasket(lab.state, str(formData, "productId", 50), str(formData, "qty", 20) || "1");
      if (r.ok) r = { ...r, message: "Added to your basket." };
      break;
    case "qty":
      r = setQuantity(lab.state, str(formData, "productId", 50), str(formData, "qty", 20));
      if (r.ok) r = { ...r, message: "Basket updated." };
      break;
    case "remove":
      r = { ok: true, state: removeFromBasket(lab.state, str(formData, "productId", 50)), message: "Removed from your basket." };
      break;
    case "code":
      r = applyCode(lab.state, str(formData, "code", 30));
      break;
    case "order":
      r = placeOrder(lab.state, { name: str(formData, "name", 100), address: str(formData, "address"), postcode: str(formData, "postcode", 20) });
      if (r.ok) r = { ...r, message: `Thank you – order ${r.value!.ref} placed. Total ${formatPence(r.value!.totalPence)}.` };
      break;
  }
  await saveLab(lab.id, r.state);
  revalidatePath("/lab/shop");
  revalidatePath("/lab/shop/checkout");
  return r.ok ? { ok: r.message ?? "Done.", at: Date.now() } : { error: r.error, at: Date.now() };
}

export async function resetLabAction() {
  const user = await requireLearner();
  await resetLab(user.id);
  revalidatePath("/lab", "layout");
}
