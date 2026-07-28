import Link from "next/link";

type ProfileEmptyStateProps = {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export function ProfileEmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
}: ProfileEmptyStateProps) {
  return (
    <div className="profile-empty">
      <p className="profile-empty-title">{title}</p>
      <p>{description}</p>
      {ctaLabel && ctaHref ? (
        <Link href={ctaHref} className="profile-empty-cta">
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
