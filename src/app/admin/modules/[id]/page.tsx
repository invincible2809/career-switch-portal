import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { requireAdmin } from "@/server/guards";
import { Badge, Card, PageHeader } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/forms/form-status";
import { Flash, type FlashParams } from "@/components/admin/flash";
import { addPrerequisiteAction, createLessonAction, removePrerequisiteAction, updateModuleAction } from "../../actions";

export const metadata: Metadata = { title: "Module – Admin" };

export default async function AdminModulePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: FlashParams }) {
  await requireAdmin("content:edit");
  const { id } = await params;
  const flash = await searchParams;
  const mod = await db.module.findUnique({
    where: { id },
    include: {
      pathway: true,
      lessons: { orderBy: { order: "asc" }, include: { publishedVersion: { select: { title: true, version: true } }, versions: { orderBy: { version: "desc" }, take: 1 } } },
      assessments: true,
    },
  });
  if (!mod) notFound();
  const [allModules, allAssessments, prereqs] = await Promise.all([
    db.module.findMany({ orderBy: [{ pathway: { order: "asc" } }, { order: "asc" }], select: { id: true, title: true } }),
    db.assessment.findMany({ select: { id: true, title: true } }),
    db.prerequisite.findMany({ where: { targetType: "ASSESSMENT", targetId: { in: mod.assessments.map((a) => a.id) } } }),
  ]);
  const describe = (p: (typeof prereqs)[number]) =>
    p.requirement === "LESSONS_COMPLETED"
      ? `All lessons completed in ${allModules.find((m) => m.id === p.requiredId)?.title ?? "?"}`
      : p.requirement === "ASSESSMENT_PASSED"
        ? `Passed ${allAssessments.find((a) => a.id === p.requiredId)?.title ?? "?"}`
        : "Competency demonstrated in an assignment";

  return (
    <div className="space-y-6">
      <PageHeader title={mod.title} intro={`${mod.pathway.title} pathway`} />
      <Flash {...flash} />

      <Card>
        <h2 className="text-xl font-bold">Module details</h2>
        <form action={updateModuleAction} className="mt-3 space-y-4">
          <input type="hidden" name="moduleId" value={mod.id} />
          <Field id="title" label="Title">
            {(a) => <Input {...a} name="title" defaultValue={mod.title} required />}
          </Field>
          <Field id="summary" label="Summary">
            {(a) => <Textarea {...a} name="summary" defaultValue={mod.summary} required className="min-h-20" />}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="availability" label="Availability">
              {(a) => (
                <Select {...a} name="availability" defaultValue={mod.availability}>
                  <option value="AVAILABLE">Available</option>
                  <option value="COMING_SOON">Coming soon</option>
                </Select>
              )}
            </Field>
            <Field id="status" label="Status">
              {(a) => (
                <Select {...a} name="status" defaultValue={mod.status}>
                  <option value="DRAFT">Draft (hidden)</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived (hidden)</option>
                </Select>
              )}
            </Field>
          </div>
          <SubmitButton>Save module</SubmitButton>
        </form>
      </Card>

      <Card>
        <h2 className="text-xl font-bold">Lessons</h2>
        <ul className="mt-3 divide-y divide-border">
          {mod.lessons.map((l) => {
            const latest = l.versions[0];
            return (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <Link href={`/admin/lessons/${l.id}`} className="font-semibold">
                  {l.order}. {l.publishedVersion?.title ?? latest?.title ?? l.slug}
                </Link>
                <span className="flex gap-2">
                  {l.publishedVersion ? <Badge tone="success">Published v{l.publishedVersion.version}</Badge> : <Badge>Not published</Badge>}
                  {latest && latest.status !== "PUBLISHED" && latest.status !== "ARCHIVED" ? (
                    <Badge tone="primary">{latest.status === "IN_REVIEW" ? "In review" : "Draft"} v{latest.version}</Badge>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
        <form action={createLessonAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <input type="hidden" name="moduleId" value={mod.id} />
          <Field id="new-title" label="New lesson title">
            {(a) => <Input {...a} name="title" required />}
          </Field>
          <Field id="new-slug" label="Web address (optional)" hint="Made from the title if left blank">
            {(a) => <Input {...a} name="slug" pattern="[a-z0-9-]+" />}
          </Field>
          <SubmitButton variant="secondary">Add lesson</SubmitButton>
        </form>
      </Card>

      {mod.assessments.map((a) => (
        <Card key={a.id} className="space-y-3">
          <h2 className="text-xl font-bold">Unlock rules for {a.title}</h2>
          <p className="text-sm text-muted">Lessons are always open. These rules only control when the assessment can be taken.</p>
          <ul className="space-y-2">
            {prereqs
              .filter((p) => p.targetId === a.id)
              .map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-3">
                  <span>{describe(p)}</span>
                  <form action={removePrerequisiteAction}>
                    <input type="hidden" name="prereqId" value={p.id} />
                    <input type="hidden" name="moduleId" value={mod.id} />
                    <button type="submit" className="text-sm text-primary underline">
                      Remove
                    </button>
                  </form>
                </li>
              ))}
          </ul>
          <form action={addPrerequisiteAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <input type="hidden" name="targetId" value={a.id} />
            <input type="hidden" name="moduleId" value={mod.id} />
            <input type="hidden" name="requirement" value="LESSONS_COMPLETED" />
            <Field id={`req-${a.id}`} label="Also require all lessons completed in">
              {(f) => (
                <Select {...f} name="requiredId">
                  {allModules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <span />
            <SubmitButton variant="secondary">Add rule</SubmitButton>
          </form>
        </Card>
      ))}
    </div>
  );
}
