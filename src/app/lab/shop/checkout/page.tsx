import type { Metadata } from "next";
import Link from "next/link";
import { requireLearner } from "@/server/guards";
import { loadLab } from "@/server/lab/session";
import { summary } from "@/server/lab/engine";
import { formatPence } from "@/lib/lab/catalogue";
import { Card, PageHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { LabNav } from "@/components/lab/lab-nav";
import { LabForm } from "@/components/lab/lab-form";

export const metadata: Metadata = { title: "Demo checkout – Test Lab" };

export default async function LabCheckout() {
  const user = await requireLearner();
  const { state } = await loadLab(user.id);
  const s = summary(state);
  const last = state.orders.at(-1);
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="ShopEasy demo checkout" intro="Test version – contains deliberate defects." />
      <LabNav current="/lab/shop" />
      <p>
        <Link href="/lab/shop">Back to the demo shop</Link>
      </p>

      <Card className="space-y-2" data-testid="lab-summary">
        <h2 className="text-xl font-bold">Order summary</h2>
        {s.lines.length === 0 ? <p>Your basket is empty.</p> : null}
        <dl className="grid max-w-sm grid-cols-2 gap-1">
          {s.lines.map((l) => (
            <div key={l.productId} className="contents">
              <dt>
                {l.qty} × {l.name}
              </dt>
              <dd>{formatPence(l.lineTotalPence)}</dd>
            </div>
          ))}
          <dt className="font-semibold">Subtotal</dt>
          <dd data-testid="checkout-subtotal">{formatPence(s.subtotalPence)}</dd>
          {s.discounts.map((d, i) => (
            <div key={i} className="contents">
              <dt>Discount {d.code}</dt>
              <dd data-testid="discount-line">-{formatPence(d.amountPence)}</dd>
            </div>
          ))}
          <dt>Delivery</dt>
          <dd data-testid="delivery">{formatPence(s.deliveryPence)}</dd>
          <dt className="font-bold">Total</dt>
          <dd className="font-bold" data-testid="total">
            {formatPence(s.totalPence)}
          </dd>
        </dl>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-xl font-bold">Discount code</h2>
        <LabForm op="code" className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="lab-code" className="block font-semibold">
              Discount code
            </label>
            <Input id="lab-code" name="code" className="w-40" />
          </div>
          <Button type="submit" variant="secondary">
            Apply
          </Button>
        </LabForm>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-xl font-bold">Delivery details</h2>
        <LabForm op="order" className="space-y-3">
          <div>
            <label htmlFor="lab-name" className="block font-semibold">
              Full name
            </label>
            <Input id="lab-name" name="name" autoComplete="off" />
          </div>
          <div>
            <label htmlFor="lab-address" className="block font-semibold">
              Address
            </label>
            <Input id="lab-address" name="address" autoComplete="off" />
          </div>
          {/* PLANTED DEFECT (a11y-postcode-label): this box has a placeholder but no label. */}
          <div>
            <Input id="lab-postcode" name="postcode" placeholder="Postcode" autoComplete="off" className="max-w-40" />
          </div>
          <Button type="submit">Place order</Button>
        </LabForm>
      </Card>

      {last ? (
        <Card data-testid="last-order">
          <h2 className="text-xl font-bold">Your last demo order</h2>
          <p>
            {last.ref} · {formatPence(last.totalPence)}
          </p>
        </Card>
      ) : null}
    </div>
  );
}
