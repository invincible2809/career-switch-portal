// Renders lesson Markdown to sanitised HTML. Supports:
//   :::hint … :::      -> an expandable hint (<details>)
//   [[term]] / [[term|label]] -> a link to the glossary
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Root as MdRoot } from "mdast";
import type { Root as HastRoot, Element } from "hast";
import { slugify } from "../content/schemas";

const GLOSSARY = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

export function glossaryToLinks(markdown: string): string {
  return markdown.replace(GLOSSARY, (_m, term: string, label?: string) => `[${(label ?? term).trim()}](/glossary/${slugify(term)})`);
}

function remarkHints() {
  return (tree: MdRoot) => {
    let n = 0;
    visit(tree, (node) => {
      if (node.type !== "containerDirective" || node.name !== "hint") return;
      n++;
      node.data = { hName: "details", hProperties: { className: ["hint"] } };
      node.children.unshift({
        type: "paragraph",
        data: { hName: "summary" },
        children: [{ type: "text", value: `Show hint ${n}` }],
      });
    });
  };
}

function rehypeGlossaryClass() {
  return (tree: HastRoot) => {
    visit(tree, "element", (el: Element) => {
      if (el.tagName === "a" && typeof el.properties?.href === "string" && el.properties.href.startsWith("/glossary/")) {
        el.properties.className = ["glossary-link"];
      }
    });
  };
}

const schema = {
  ...defaultSchema,
  clobberPrefix: "",
  tagNames: [...(defaultSchema.tagNames ?? []), "details", "summary"],
  attributes: {
    ...defaultSchema.attributes,
    details: ["className"],
    a: [...(defaultSchema.attributes?.a ?? []), "className"],
  },
};

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkDirective)
  .use(remarkHints)
  .use(remarkRehype)
  .use(rehypeSanitize, schema)
  .use(rehypeGlossaryClass)
  .use(rehypeStringify);

export function renderMarkdown(markdown: string): string {
  return String(processor.processSync(glossaryToLinks(markdown)));
}

/** Plain text of a section, for the browser's read-aloud feature. */
export function markdownToSpeech(markdown: string): string {
  return glossaryToLinks(markdown)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/:::\w*/g, "")
    .replace(/[#*_>`|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
