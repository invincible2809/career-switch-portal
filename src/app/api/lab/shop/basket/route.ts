import { clearBasket, summary } from "@/server/lab/engine";
import { labApi } from "@/server/lab/api";
import { formatPence } from "@/lib/lab/catalogue";

export async function GET() {
  return labApi((state) => {
    const s = summary(state);
    return {
      json: {
        lines: s.lines.map((l) => ({ productId: l.productId, name: l.name, quantity: l.qty, lineTotal: formatPence(l.lineTotalPence) })),
        subtotal: formatPence(s.subtotalPence),
        discounts: s.discounts.map((d) => ({ code: d.code, amount: formatPence(d.amountPence) })),
        delivery: formatPence(s.deliveryPence),
        total: formatPence(s.totalPence),
      },
    };
  });
}

export async function DELETE() {
  return labApi((state) => ({ ok: true, state: clearBasket(state), message: "Basket emptied." }));
}
