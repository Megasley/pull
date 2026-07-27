import Image from "next/image";

import { cn } from "@/lib/utils";

type LessonImageProps = {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  className?: string;
};

function isSvgAsset(src: string) {
  return src.toLowerCase().includes(".svg");
}

export function LessonImage({
  src,
  alt,
  caption,
  width = 1200,
  height = 675,
  className,
}: LessonImageProps) {
  const isRemote = src.startsWith("http://") || src.startsWith("https://");
  const isSvg = isSvgAsset(src);

  return (
    <figure className={cn("my-8 not-prose", className)}>
      <div
        className={cn(
          "overflow-hidden rounded-none border border-border",
          isSvg ? "bg-[#0b0f14] p-2 sm:p-4" : "bg-muted/20",
        )}
      >
        {isRemote || isSvg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            className="mx-auto h-auto w-full max-w-full object-contain"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="h-auto w-full object-contain"
          />
        )}
      </div>
      {caption ? (
        <figcaption className="mt-3 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
