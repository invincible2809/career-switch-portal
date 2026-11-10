import { LAB_SPEC } from "@/lib/lab/spec";

export function LabSpec({ headingLevel = 2 }: { headingLevel?: 2 | 3 }) {
  const H = `h${headingLevel}` as "h2";
  return (
    <section aria-labelledby="lab-spec" className="space-y-3">
      <H id="lab-spec" className="text-xl font-bold">
        ShopEasy demo shop specification
      </H>
      <p className="text-muted">Expected results come from this specification.</p>
      {LAB_SPEC.map((s) => (
        <div key={s.area}>
          <h3 className="font-bold">{s.area}</h3>
          <ul className="list-disc pl-5">
            {s.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
