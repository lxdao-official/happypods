import { generatePageMetadata } from "~/lib/metadata";

export const metadata = generatePageMetadata("grants-pool");

export default function GrantsPoolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}