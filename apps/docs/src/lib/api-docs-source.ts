import { readFile } from "node:fs/promises";
import path from "node:path";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import { apiDocsPath, homepagePath } from "./site-routes";

export interface ApiHeading {
  depth: 2 | 3;
  slug: string;
  text: string;
}

export interface ApiDocsSource {
  title: string;
  introMarkdown: string;
  introHtml: string;
  bodyMarkdown: string;
  bodyHtml: string;
  headings: ApiHeading[];
}

interface ParseOptions {
  basePath: string;
}

type MarkdownNode = {
  type: string;
  url?: string;
  depth?: number;
  value?: string;
  children?: MarkdownNode[];
  position?: {
    start?: { offset?: number };
    end?: { offset?: number };
  };
  data?: Record<string, unknown>;
};

function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[`"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || "section";
}

function rewriteMarkdownLink(url: string, basePath: string): string {
  if (
    url.startsWith("#") ||
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("mailto:")
  ) {
    return url;
  }

  const [pathname, hash] = url.split("#");
  const suffix = hash ? `#${hash}` : "";

  if (
    pathname === "README.md" ||
    pathname === "./README.md" ||
    pathname === "../README.md"
  ) {
    return `${homepagePath(basePath)}${suffix}`;
  }

  if (
    pathname === "api.md" ||
    pathname === "./api.md" ||
    pathname === "docs/api.md" ||
    pathname === "../docs/api.md"
  ) {
    return `${apiDocsPath(basePath)}${suffix}`;
  }

  return url;
}

function visit(
  node: MarkdownNode,
  callback: (currentNode: MarkdownNode) => void
): void {
  callback(node);

  for (const child of node.children ?? []) {
    visit(child, callback);
  }
}

function collectText(node: MarkdownNode): string {
  if (node.type === "text" || node.type === "inlineCode") {
    return node.value ?? "";
  }

  return (node.children ?? []).map((child) => collectText(child)).join("");
}

function renderMarkdownNodes(nodes: MarkdownNode[]): string {
  if (nodes.length === 0) {
    return "";
  }

  const processor = unified().use(remarkRehype).use(rehypeStringify);
  const htmlTree = processor.runSync({
    type: "root",
    children: nodes,
  } as never);

  return processor.stringify(htmlTree).trim();
}

function extractMarkdownSlice(
  markdown: string,
  startOffset: number,
  endOffset?: number
): string {
  return markdown.slice(startOffset, endOffset).trim();
}

export function parseApiDocsMarkdown(
  markdown: string,
  options: ParseOptions
): ApiDocsSource {
  const parser = unified().use(remarkParse).use(remarkGfm);
  const tree = parser.parse(markdown) as MarkdownNode;
  const rootChildren = tree.children ?? [];
  const titleNode = rootChildren[0];

  if (titleNode?.type !== "heading" || titleNode.depth !== 1) {
    throw new Error("docs/api.md must start with an H1 heading.");
  }

  const title = collectText(titleNode);
  const contentNodes = rootChildren.slice(1);
  const firstBodyNodeIndex = contentNodes.findIndex(
    (node) => node.type === "heading" && node.depth === 2
  );
  const introNodes =
    firstBodyNodeIndex === -1
      ? contentNodes
      : contentNodes.slice(0, firstBodyNodeIndex);
  const bodyNodes =
    firstBodyNodeIndex === -1 ? [] : contentNodes.slice(firstBodyNodeIndex);
  const introStartOffset = titleNode.position?.end?.offset ?? 0;
  const bodyStartOffset = bodyNodes[0]?.position?.start?.offset;
  const introMarkdown = extractMarkdownSlice(
    markdown,
    introStartOffset,
    bodyStartOffset
  );
  const bodyMarkdown =
    bodyStartOffset === undefined
      ? ""
      : extractMarkdownSlice(markdown, bodyStartOffset);
  const headings: ApiHeading[] = [];
  const slugCounts = new Map<string, number>();

  for (const node of [...introNodes, ...bodyNodes]) {
    visit(node, (currentNode) => {
      if (currentNode.type === "link" && currentNode.url) {
        currentNode.url = rewriteMarkdownLink(
          currentNode.url,
          options.basePath
        );
      }

      if (
        currentNode.type !== "heading" ||
        (currentNode.depth !== 2 && currentNode.depth !== 3)
      ) {
        return;
      }

      if (!bodyNodes.includes(node)) {
        return;
      }

      const text = collectText(currentNode);
      const baseSlug = slugify(text);
      const nextCount = (slugCounts.get(baseSlug) ?? 0) + 1;
      slugCounts.set(baseSlug, nextCount);
      const slug = nextCount === 1 ? baseSlug : `${baseSlug}-${nextCount}`;

      currentNode.data = {
        ...(currentNode.data ?? {}),
        hProperties: {
          id: slug,
        },
      };

      headings.push({
        depth: currentNode.depth,
        slug,
        text,
      });
    });
  }

  return {
    title,
    introMarkdown,
    introHtml: renderMarkdownNodes(introNodes),
    bodyMarkdown,
    bodyHtml: renderMarkdownNodes(bodyNodes),
    headings,
  };
}

export async function loadApiDocsSource(
  options: { basePath?: string; markdownPath?: string } = {}
): Promise<ApiDocsSource> {
  const markdownPath =
    options.markdownPath ??
    path.resolve(process.cwd(), "..", "..", "docs", "api.md");
  const markdown = await readFile(markdownPath, "utf8");

  return parseApiDocsMarkdown(markdown, {
    basePath: options.basePath ?? "/",
  });
}
