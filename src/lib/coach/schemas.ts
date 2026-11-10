import { z } from "zod";

const pathway = z.enum(["SCRUM_MASTER", "QA_TESTER", "ANY"]);

export const interviewFileSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z0-9-]+$/),
        pathway,
        question: z.string().min(10),
        lookFor: z.string().min(10),
        keyPoints: z.array(z.object({ label: z.string().min(3), terms: z.array(z.string().min(1)).min(1) })).min(2),
        outline: z.string().min(20),
      }),
    )
    .min(1),
});

const choice = z.object({
  text: z.string().min(1),
  quality: z.enum(["good", "ok", "poor"]),
  feedback: z.string().min(5),
  next: z.string(),
});

export const roleplayFileSchema = z.object({
  roleplays: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z0-9-]+$/),
        pathway,
        title: z.string().min(5),
        intro: z.string().min(10),
        start: z.string(),
        nodes: z.record(z.string(), z.object({ speaker: z.string(), line: z.string().min(5), choices: z.array(choice) })),
      }),
    )
    .min(1)
    .superRefine((roleplays, ctx) => {
      for (const rp of roleplays) {
        if (!rp.nodes[rp.start]) ctx.addIssue({ code: "custom", message: `${rp.id}: start node "${rp.start}" is missing` });
        for (const [id, node] of Object.entries(rp.nodes))
          for (const c of node.choices)
            if (!rp.nodes[c.next]) ctx.addIssue({ code: "custom", message: `${rp.id}/${id}: choice leads to missing node "${c.next}"` });
      }
    }),
});

export type InterviewQuestion = z.infer<typeof interviewFileSchema>["questions"][number];
export type RolePlay = z.infer<typeof roleplayFileSchema>["roleplays"][number];
