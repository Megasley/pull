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

export function LessonImage({
  src,
  alt,
  caption,
  width = 1200,
  height = 675,
  className,
}: LessonImageProps) {
  const isRemote = src.startsWith("http://") || src.startsWith("https://");

  return (
    <figure className={cn("my-8 not-prose", className)}>
      <div className="overflow-hidden rounded-none border border-border bg-muted/20">
        {isRemote ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="h-auto w-full object-cover" />
        ) : (
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="h-auto w-full object-cover"
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
