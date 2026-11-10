interface Criterion {
  key: string;
  title: string;
  autoCheck: string | null;
  descriptors: unknown;
}

export function RubricTable({ criteria, minEach }: { criteria: Criterion[]; minEach: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse bg-surface text-left text-sm">
        <caption className="mb-2 text-left text-base">
          Each criterion is scored 0–3. <strong>Competency is demonstrated only if no criterion scores below {minEach}.</strong>
        </caption>
        <thead>
          <tr>
            <th scope="col" className="border border-border p-2">Criterion</th>
            {[0, 1, 2, 3].map((n) => (
              <th key={n} scope="col" className="border border-border p-2">
                {n}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {criteria.map((c) => {
            const d = c.descriptors as Record<string, string>;
            return (
              <tr key={c.key}>
                <th scope="row" className="border border-border p-2 align-top">
                  {c.title}
                  <span className="block font-normal text-muted">{c.autoCheck ? "Checked automatically" : "Scored by an assessor"}</span>
                </th>
                {[0, 1, 2, 3].map((n) => (
                  <td key={n} className="border border-border p-2 align-top">
                    {d[String(n)]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
