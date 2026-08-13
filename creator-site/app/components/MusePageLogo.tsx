import Image from "next/image";
import Link from "next/link";

type MusePageLogoProps = {
  href?: string;
  compact?: boolean;
  subtitle?: boolean;
  className?: string;
  iconSize?: number;
};

export default function MusePageLogo({
  href = "/",
  compact = false,
  subtitle = false,
  className = "",
  iconSize = 40,
}: MusePageLogoProps) {
  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image
        src="/musepage-icon.png"
        alt="MusePage"
        width={iconSize}
        height={iconSize}
        priority
        className="shrink-0 object-contain"
      />

      {!compact && (
        <div className="min-w-0 text-left">
          <p className="truncate text-base font-bold tracking-tight text-white">
            MusePage
          </p>
          {subtitle && (
            <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.2em] text-gray-600">
              Creator platform
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} aria-label="MusePage home" className="inline-flex">
      {content}
    </Link>
  );
}