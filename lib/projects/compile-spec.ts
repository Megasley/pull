import { compileLessonMdx } from "@/lib/content/compile-mdx";

export async function compileProjectMdx(source: string) {
  return compileLessonMdx(source);
}
