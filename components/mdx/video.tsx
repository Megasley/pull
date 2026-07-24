import { cn } from "@/lib/utils";

type VideoProps = {
  src: string;
  title: string;
  className?: string;
};

function getEmbedUrl(src: string): string | null {
  try {
    const url = new URL(src);

    if (url.hostname.includes("youtube.com")) {
      const videoId = url.searchParams.get("v");

      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (url.hostname === "youtu.be") {
      return `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
    }

    if (url.hostname.includes("vimeo.com")) {
      const videoId = url.pathname.split("/").filter(Boolean).at(-1);

      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }

    if (url.pathname.endsWith(".mp4")) {
      return src;
    }

    return src;
  } catch {
    return null;
  }
}

export function Video({ src, title, className }: VideoProps) {
  const embedUrl = getEmbedUrl(src);

  if (!embedUrl) {
    return null;
  }

  if (embedUrl.endsWith(".mp4")) {
    return (
      <div className={cn("my-8 overflow-hidden rounded-none border border-border", className)}>
        <video controls className="aspect-video w-full bg-black" title={title}>
          <source src={embedUrl} type="video/mp4" />
        </video>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "my-8 overflow-hidden rounded-none border border-border bg-black",
        className,
      )}
    >
      <iframe
        src={embedUrl}
        title={title}
        className="aspect-video w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
