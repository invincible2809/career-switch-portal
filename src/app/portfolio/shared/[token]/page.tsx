import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findShare, portfolioItems } from "@/server/portfolio";
import { Alert, Card, PageHeader } from "@/components/ui/card";
import { PortfolioItemView } from "@/components/portfolio/item-view";
import { PORTFOLIO_LABEL } from "@/lib/portfolio/format";

export const metadata: Metadata = { title: "Shared portfolio", robots: { index: false, follow: false } };

/** Public, unlisted view of the items a learner chose to share. Shows only their name and those items. */
export default async function SharedPortfolioPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const share = await findShare(token);
  if (!share) notFound();
  const items = await portfolioItems(share.user.id, true);
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title={`Portfolio: ${share.user.displayName}`} intro="Shared from Career Switch Portal, a self-paced learning course." />
      <Alert tone="warning">
        <strong>{PORTFOLIO_LABEL}.</strong> These are exercises completed on a learning course, using a fictional company (ShopEasy). The course is not an
        accredited qualification.
      </Alert>
      {items.length === 0 ? <p>No items are shared at the moment.</p> : null}
      {items.map((i) => (
        <Card key={i.id}>
          <PortfolioItemView item={i} />
        </Card>
      ))}
    </div>
  );
}
