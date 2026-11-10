import type { Metadata } from "next";
import { db } from "@/server/db";
import { requireLearner } from "@/server/guards";
import { portfolioItems } from "@/server/portfolio";
import { deleteItemAction, toggleShareItemAction, turnOffShareAction } from "./actions";
import { Alert, Card, PageHeader } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { SubmitButton } from "@/components/forms/form-status";
import { AddLabWorkForm, AddSubmissionForm, ReflectionForm, ShareForm } from "@/components/portfolio/forms";
import { PortfolioItemView } from "@/components/portfolio/item-view";
import { PORTFOLIO_LABEL } from "@/lib/portfolio/format";

export const metadata: Metadata = { title: "Portfolio" };

export default async function PortfolioPage() {
  const user = await requireLearner();
  const [items, submissions, share] = await Promise.all([
    portfolioItems(user.id),
    db.submission.findMany({ where: { userId: user.id }, orderBy: { submittedAt: "desc" }, include: { assignment: { select: { title: true } }, competency: true } }),
    db.portfolioShare.findFirst({ where: { userId: user.id, enabled: true, revokedAt: null } }),
  ]);
  const options = submissions.map((s) => ({
    id: s.id,
    label: `${s.assignment.title} – ${s.submittedAt.toLocaleDateString("en-GB")}${s.competency ? (s.competency.assessedBy === "ASSESSOR" ? " (competency demonstrated – assessor reviewed)" : " (competency demonstrated – automated checks)") : ""}`,
  }));

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Portfolio" intro="Collect your practical work to show employers. Every item is clearly labelled as a simulated learning project." />
      <Alert tone="warning">
        <strong>{PORTFOLIO_LABEL}.</strong> This label is added to every item, on screen, in the PDF and on your share link. Be honest about this in
        applications – it&apos;s good evidence of what you can do, not paid experience.
      </Alert>

      <div className="flex flex-wrap gap-3">
        <a href="/api/portfolio/pdf" className={buttonVariants()} download>
          Download as PDF
        </a>
      </div>

      <section aria-labelledby="items-h" className="space-y-3">
        <h2 id="items-h" className="text-xl font-bold">
          Your items ({items.length})
        </h2>
        {items.length === 0 ? <p>Nothing here yet. Add your practical work, Test Lab work or a reflection below.</p> : null}
        {items.map((i) => (
          <Card key={i.id} className="space-y-3">
            <PortfolioItemView item={i} />
            <div className="flex flex-wrap gap-4 border-t border-border pt-2">
              <form action={toggleShareItemAction}>
                <input type="hidden" name="id" value={i.id} />
                <button type="submit" className="text-sm text-primary underline">
                  {i.includeInShare ? `Hide "${i.title}" from the share link` : `Show "${i.title}" on the share link`}
                </button>
              </form>
              <form action={deleteItemAction}>
                <input type="hidden" name="id" value={i.id} />
                <button type="submit" className="text-sm text-danger underline">
                  Remove &quot;{i.title}&quot;
                </button>
              </form>
            </div>
          </Card>
        ))}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-3">
          <h2 className="text-lg font-bold">Add practical work</h2>
          <AddSubmissionForm options={options} />
        </Card>
        <Card className="space-y-3">
          <h2 className="text-lg font-bold">Add Test Lab work</h2>
          <p className="text-sm text-muted">Adds a snapshot of your current test cases and defect reports.</p>
          <AddLabWorkForm />
        </Card>
      </div>
      <Card className="space-y-3">
        <h2 className="text-lg font-bold">Add a reflection</h2>
        <p className="text-sm text-muted">For example: what you learned from a scenario, or how you&apos;d handle it differently next time.</p>
        <ReflectionForm />
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-bold">Private share link</h2>
        <p>
          Anyone with the link can see the items you choose to show – nothing else. Search engines don&apos;t list it, and you can turn it off at any time.
        </p>
        <p className="font-semibold" data-testid="share-status">
          {share ? `A share link is on (created ${share.createdAt.toLocaleDateString("en-GB")}).` : "Sharing is off."}
        </p>
        <ShareForm active={!!share} />
        {share ? (
          <form action={turnOffShareAction}>
            <SubmitButton variant="danger" size="sm">
              Turn off sharing
            </SubmitButton>
          </form>
        ) : null}
      </Card>
    </div>
  );
}
