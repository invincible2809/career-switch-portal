import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/guards";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ROLE_COMPARISON } from "@/lib/onboarding/recommend";

export default async function HomePage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold sm:text-4xl">Move into tech, one clear step at a time</h1>
        <p className="max-w-prose text-lg">
          A self-paced course for adults with no IT background who want to work as a <strong>Scrum Master</strong> or a{" "}
          <strong>QA Tester</strong>. Learn in plain English, practise realistic tasks, and check your understanding as
          you go.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/register" className={buttonVariants()}>
            Create a free account
          </Link>
          <Link href="/login" className={buttonVariants({ variant: "secondary" })}>
            Log in
          </Link>
        </div>
      </section>

      <section aria-labelledby="roles" className="space-y-4">
        <h2 id="roles" className="text-2xl font-bold">
          Two roles to choose from
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {(["SCRUM_MASTER", "QA_TESTER"] as const).map((r) => (
            <Card key={r}>
              <h3 className="text-xl font-bold">{r === "SCRUM_MASTER" ? "Scrum Master" : "QA Tester"}</h3>
              <p className="mt-2">{ROLE_COMPARISON[r].dayToDay}</p>
              <p className="mt-2 text-muted">
                <strong className="text-text">Typical routes in:</strong> {ROLE_COMPARISON[r].entryRoutes}
              </p>
            </Card>
          ))}
        </div>
        <p>Not sure? A short, friendly set of questions will help you choose. You can change your mind at any time.</p>
      </section>

      <section aria-labelledby="honest" className="space-y-2">
        <h2 id="honest" className="text-2xl font-bold">
          What this course is – and isn&apos;t
        </h2>
        <ul className="max-w-prose list-disc space-y-1 pl-5">
          <li>Content is aligned with the Scrum Guide (2020) and ISTQB Foundation terminology.</li>
          <li>It is not an accredited qualification, and it doesn&apos;t replace external certification.</li>
          <li>Completing it doesn&apos;t guarantee a job or count as paid work experience.</li>
          <li>Practice projects are simulated, and clearly labelled as such.</li>
        </ul>
      </section>
    </div>
  );
}
