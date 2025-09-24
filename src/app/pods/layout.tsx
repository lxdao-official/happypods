import { generatePageMetadata } from "~/lib/metadata";

export const metadata = generatePageMetadata("pods");

export default function PodsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}