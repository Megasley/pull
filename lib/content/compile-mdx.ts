import { compileMDX } from "next-mdx-remote/rsc";
import type { CompileOptions } from "@mdx-js/mdx";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import { mdxComponents } from "@/components/mdx/mdx-components";

const mdxOptions = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [
    rehypeSlug,
    [
      rehypeAutolinkHeadings,
      {
        behavior: "wrap" as const,
        properties: {
          className: ["anchor"],
        },
      },
    ],
    [
      rehypePrettyCode,
      {
        theme: "github-dark-default",
        keepBackground: false,
      },
    ],
  ],
} satisfies CompileOptions;

export async function compileLessonMdx(source: string) {
  return compileMDX({
    source,
    components: mdxComponents,
    options: {
      mdxOptions,
    },
  });
}
