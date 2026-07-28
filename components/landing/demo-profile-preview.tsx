import Image from "next/image";
import Link from "next/link";

import { DEMO_PROFILE_USERNAME } from "@/lib/demo/constants";

const DEMO_PROFILE_PATH = `/u/${DEMO_PROFILE_USERNAME}`;
const DEMO_PROFILE_SCREENSHOT = "/marketing/demo-satoshi-profile.png";

export function DemoProfilePreview() {
  return (
    <Link
      href={DEMO_PROFILE_PATH}
      className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--signal)]"
    >
      <div className="overflow-hidden border border-white/20 bg-[#f4f4ef] shadow-[8px_8px_0_0_var(--signal)] transition-transform duration-300 group-hover:-translate-y-0.5">
        <div className="flex items-center gap-2 border-b border-ink/10 bg-white/95 px-3 py-2.5">
          <span aria-hidden className="size-2 rounded-full bg-ink/15" />
          <span aria-hidden className="size-2 rounded-full bg-ink/15" />
          <span aria-hidden className="size-2 rounded-full bg-ink/15" />
          <span className="ml-1 truncate font-mono text-[10px] tracking-[0.08em] text-ink/55">
            pull.dev{DEMO_PROFILE_PATH}
          </span>
        </div>
        <div className="relative aspect-[1280/900] overflow-hidden">
          <Image
            src={DEMO_PROFILE_SCREENSHOT}
            alt="Example Pull builder profile for Satoshi with builder score, open source reputation, and contribution statistics"
            fill
            className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.015]"
            sizes="(max-width: 1024px) 100vw, 560px"
          />
        </div>
      </div>
      <p className="mt-3 font-mono text-[11px] tracking-[0.12em] text-[var(--signal)] uppercase transition-opacity group-hover:opacity-80">
        cat ./u/{DEMO_PROFILE_USERNAME} →
      </p>
    </Link>
  );
}
