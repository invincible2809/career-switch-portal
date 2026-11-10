import type { Metadata } from "next";
import Link from "next/link";
import { requireLearner } from "@/server/guards";
import { loadLab } from "@/server/lab/session";
import { summary } from "@/server/lab/engine";
import { LAB_PRODUCTS, formatPence } from "@/lib/lab/catalogue";
import { Card, PageHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Button, buttonVariants } from "@/components/ui/button";
import { LabNav } from "@/components/lab/lab-nav";
import { LabForm } from "@/components/lab/lab-form";

export const metadata: Metadata = { title: "Demo shop – Test Lab" };

export default async function LabShop() {
  const user = await requireLearner();
  const { state } = await loadLab(user.id);
  const s = summary(state);
  return (
    <div className="space-y-6">
      <PageHeader title="ShopEasy demo shop" intro="Test version – synthetic products and a demo account. Contains deliberate defects." />
      <LabNav current="/lab/shop" />

      <Card className="space-y-3" data-testid="lab-login">
        <h2 className="text-xl font-bold">Demo shop account</h2>
        {state.loggedIn ? (
          <LabForm op="logout" className="flex flex-wrap items-center gap-3">
            <p>You&apos;re logged in to the demo shop.</p>
            <Button type="submit" variant="secondary" size="sm">
              Log out of the demo shop
            </Button>
          </LabForm>
        ) : (
          <LabForm op="login" className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div>
              <label htmlFor="lab-email" className="block font-semibold">
                Demo shop email
              </label>
              <Input id="lab-email" name="email" autoComplete="off" />
            </div>
            <div>
              <label htmlFor="lab-password" className="block font-semibold">
                Demo shop password
              </label>
              <Input id="lab-password" name="password" type="password" autoComplete="off" />
            </div>
            <Button type="submit">Log in to the shop</Button>
          </LabForm>
        )}
      </Card>

      <section aria-labelledby="products-h" className="space-y-3">
        <h2 id="products-h" className="text-xl font-bold">
          Products
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LAB_PRODUCTS.map((p) => (
            <li key={p.id}>
              <Card className="space-y-2" data-testid={`product-${p.id}`}>
                <h3 className="font-bold">{p.name}</h3>
                <p>
                  {p.priceLabel} · {p.stock} in stock
                </p>
                <LabForm op="add" className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="productId" value={p.id} />
                  <div>
                    <label htmlFor={`add-${p.id}`} className="block text-sm font-semibold">
                      Quantity<span className="sr-only"> of {p.name} to add</span>
                    </label>
                    <Input id={`add-${p.id}`} name="qty" defaultValue="1" inputMode="numeric" className="w-20" />
                  </div>
                  <Button type="submit" size="sm">
                    Add to basket
                  </Button>
                </LabForm>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <Card className="space-y-3" data-testid="lab-basket">
        <h2 className="text-xl font-bold">Basket</h2>
        {s.lines.length === 0 ? <p>Your basket is empty.</p> : null}
        <ul className="space-y-3">
          {s.lines.map((l) => (
            <li key={l.productId} className="flex flex-wrap items-end gap-3 border-b border-border pb-3" data-testid={`line-${l.productId}`}>
              <span className="min-w-40 font-semibold">{l.name}</span>
              <LabForm op="qty" className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="productId" value={l.productId} />
                <div>
                  <label htmlFor={`qty-${l.productId}`} className="block text-sm font-semibold">
                    Quantity of {l.name}
                  </label>
                  <Input id={`qty-${l.productId}`} name="qty" defaultValue={String(l.qty)} key={l.qty} inputMode="numeric" className="w-20" />
                </div>
                <Button type="submit" variant="secondary" size="sm">
                  Update
                </Button>
              </LabForm>
              <span data-testid="line-total">{formatPence(l.lineTotalPence)}</span>
              <LabForm op="remove">
                <input type="hidden" name="productId" value={l.productId} />
                <button type="submit" className="text-sm text-primary underline">
                  Remove {l.name}
                </button>
              </LabForm>
            </li>
          ))}
        </ul>
        {s.lines.length > 0 ? (
          <>
            <dl className="grid max-w-xs grid-cols-2 gap-1">
              <dt>Subtotal</dt>
              <dd data-testid="subtotal">{formatPence(s.subtotalPence)}</dd>
            </dl>
            <Link href="/lab/shop/checkout" className={buttonVariants()}>
              Go to checkout
            </Link>
          </>
        ) : null}
      </Card>
    </div>
  );
}
