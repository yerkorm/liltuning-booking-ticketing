import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm px-6 py-3 font-heading uppercase tracking-wide text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const variants = {
  primary: "bg-brand-red text-white hover:bg-brand-red-hover",
  secondary: "bg-brand-black text-white hover:bg-neutral-800",
  outline: "border-2 border-brand-black text-brand-black hover:bg-brand-black hover:text-white",
  "outline-white": "border-2 border-white text-white hover:bg-white hover:text-brand-black",
};

type Variant = keyof typeof variants;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function LinkButton({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}
