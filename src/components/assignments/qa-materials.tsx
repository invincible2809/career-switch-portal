import { CHECKOUT_SPEC, SESSION_LOG } from "@/lib/assignments/qa-session-log";

export function QaMaterials() {
  return (
    <div className="space-y-4">
      <section aria-labelledby="spec-h">
        <h3 id="spec-h" className="text-lg font-bold">
          ShopEasy checkout specification
        </h3>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {CHECKOUT_SPEC.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="log-h">
        <h3 id="log-h" className="text-lg font-bold">
          Test session log
        </h3>
        <p className="text-muted">A colleague tried these things on the test version of the checkout and wrote down what happened.</p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse bg-surface text-left text-sm">
            <caption className="sr-only">Test session log</caption>
            <thead>
              <tr>
                <th scope="col" className="border border-border p-2">Entry</th>
                <th scope="col" className="border border-border p-2">What they did</th>
                <th scope="col" className="border border-border p-2">What happened</th>
              </tr>
            </thead>
            <tbody>
              {SESSION_LOG.map((e) => (
                <tr key={e.n}>
                  <td className="border border-border p-2">{e.n}</td>
                  <td className="border border-border p-2">{e.action}</td>
                  <td className="border border-border p-2">{e.observed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
