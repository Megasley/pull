import { Suspense } from "react";

import { PageHeader } from "@/components/design-system";
import { BuildersDirectory } from "@/components/builders/builders-directory";
import { SiteContainer } from "@/components/layout/site-container";
import {
  BUILDERS_PAGE_SIZE,
  isBuilderDirectorySort,
  listBuildersForDirectory,
  listBuildersToWatch,
} from "@/lib/builders/directory";
import {
  BUILDER_DIRECTORY_FILTERS,
  isLookingForId,
  type LookingForId,
} from "@/lib/builders/looking-for";

export const metadata = {
  title: "Builders",
  description:
    "Browse Pull builders by skills, reputation, activity, and what they’re looking for.",
};

export const dynamic = "force-dynamic";

type BuildersPageProps = {
  searchParams: Promise<{
    q?: string;
    skill?: string | string[];
    looking?: string | string[];
    sort?: string;
    page?: string;
  }>;
};

function asStringList(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value;
  if (value) return [value];
  return [];
}

export default async function BuildersPage({ searchParams }: BuildersPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const sort = isBuilderDirectorySort(params.sort) ? params.sort : "oss";

  const activeSkills = asStringList(params.skill).filter((skill) =>
    BUILDER_DIRECTORY_FILTERS.some(
      (option) => option.toLowerCase() === skill.toLowerCase(),
    ),
  );

  const activeLooking = asStringList(params.looking).filter(
    (id): id is LookingForId =>
      isLookingForId(id) && id !== "not_actively_looking",
  );

  const [result, featured] = await Promise.all([
    listBuildersForDirectory({
      q: query,
      skills: activeSkills,
      lookingFor: activeLooking,
      sort,
      page,
      pageSize: BUILDERS_PAGE_SIZE,
    }),
    listBuildersToWatch(3),
  ]);

  return (
    <SiteContainer className="pt-12 pb-16">
      <PageHeader
        eyebrow="builders // directory"
        title="Builders"
        description="Find contributors by name, skills, reputation, and what they’re looking for. Built for maintainers hiring talent — and builders finding their next contribution."
      />

      <div className="mt-10">
        <Suspense fallback={null}>
          <BuildersDirectory
            builders={result.builders}
            featured={featured}
            query={query}
            activeSkills={activeSkills}
            activeLooking={activeLooking}
            sort={sort}
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
          />
        </Suspense>
      </div>
    </SiteContainer>
  );
}
