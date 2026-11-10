import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Privacy notice" };

export default function PrivacyPage() {
  return (
    <div className="prose-lesson">
      <PageHeader title="Privacy notice" intro="How we use your information, in plain English (UK GDPR)." />
      <h2 className="text-xl font-bold">What we collect</h2>
      <ul>
        <li>
          <strong>To run your account:</strong> your name, email address and a scrambled (hashed) version of your
          password. We can&apos;t see your password.
        </li>
        <li>
          <strong>To save your learning:</strong> lesson progress, answers to quizzes and assessments, notes, bookmarks
          and work you submit.
        </li>
        <li>
          <strong>Only if you agree:</strong> your previous job and industry, and any accessibility needs you tell us
          about. We use these to personalise your plan and display settings. You can say no and still use everything.
        </li>
      </ul>
      <h2 className="text-xl font-bold">What we don&apos;t do</h2>
      <ul>
        <li>We don&apos;t sell your data or use it for advertising.</li>
        <li>We don&apos;t send your answers or notes to any outside AI service.</li>
        <li>Practice areas only ever use made-up (synthetic) data.</li>
      </ul>
      <h2 className="text-xl font-bold">Who can see it</h2>
      <p>
        Only you can see your notes and answers. Course administrators can see learning records where their role needs
        it – for example to review submitted work – and most reports only show totals across all learners.
      </p>
      <h2 className="text-xl font-bold">Your rights</h2>
      <ul>
        <li>Download all your data at any time from Settings → Your data.</li>
        <li>Delete your account and data at any time from the same page. This can&apos;t be undone.</li>
        <li>Change or remove optional information whenever you like.</li>
      </ul>
      <p className="text-sm text-muted">
        This notice describes how the software works. Whoever runs this portal must add their own contact details and
        lawful basis before it is used with real learners.
      </p>
    </div>
  );
}
