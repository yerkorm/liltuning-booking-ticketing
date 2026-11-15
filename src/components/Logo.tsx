import Image from "next/image";
import Link from "next/link";

export function Logo({
  variant = "black",
  className = "",
  priority = false,
}: {
  variant?: "black" | "white";
  className?: string;
  priority?: boolean;
}) {
  const src = variant === "black" ? "/logo-black.png" : "/logo-white.png";
  return (
    <Link href="/" className={`inline-flex items-center ${className}`}>
      <Image
        src={src}
        alt="LilTuning — Car Audio for Fanatics"
        width={600}
        height={200}
        priority={priority}
        className="h-10 w-auto sm:h-12"
      />
    </Link>
  );
}
