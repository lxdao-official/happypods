import { generatePageMetadata } from "~/lib/metadata";

export const metadata = generatePageMetadata("how-it-works");

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}