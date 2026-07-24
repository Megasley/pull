import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  showWordmark?: boolean;
};

export function Logo({ className, showWordmark = true }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center bg-ink transition-opacity hover:opacity-90",
        showWordmark ? "px-2.5 py-1.5" : "p-1.5",
        className,
      )}
      aria-label="Pull home"
    >
      {showWordmark ? (
        <Image
          src="/pull-logo-dark.png"
          alt=""
          width={96}
          height={41}
          className="h-6 w-auto sm:h-7"
          priority
        />
      ) : (
        <Image
          src="/pull-mark-dark.png"
          alt=""
          width={28}
          height={28}
          className="size-6 sm:size-7"
          priority
        />
      )}
    </Link>
  );
}
