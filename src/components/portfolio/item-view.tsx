import type { PortfolioView } from "@/server/portfolio";
import { PORTFOLIO_LABEL } from "@/lib/portfolio/format";
import { Badge } from "@/components/ui/card";

export function PortfolioItemView({ item, headingLevel = 2 }: { item: PortfolioView; headingLevel?: 2 | 3 }) {
  const H = `h${headingLevel}` as "h2";
  return (
    <article className="space-y-2" data-testid="portfolio-item">
      <H className="text-lg font-bold">{item.title}</H>
      <p>
        <Badge tone="warning">{PORTFOLIO_LABEL}</Badge>
      </p>
      {item.competency ? <p className="text-sm text-muted">{item.competency}</p> : null}
      {item.sections.map((s, i) => (
        <section key={i}>
          <h4 className="font-semibold">{s.heading}</h4>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {s.lines.map((l, j) => (
              <li key={j} className="break-words">
                {l}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </article>
  );
}
