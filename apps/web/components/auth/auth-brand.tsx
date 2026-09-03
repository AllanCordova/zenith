import Image from "next/image";

type AuthBrandProps = {
  size?: "sm" | "lg";
};

const sizes = {
  sm: { className: "h-16 w-16", px: 64 },
  lg: { className: "mb-4 h-24 w-24", px: 96 },
} as const;

export function AuthBrand({ size = "lg" }: AuthBrandProps) {
  const { className, px } = sizes[size];

  return (
    <Image
      src="/logo/screen.png"
      alt="Zenith"
      width={px}
      height={px}
      priority
      className={`object-contain ${className}`}
    />
  );
}
