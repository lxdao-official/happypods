import { generatePageMetadata } from "~/lib/metadata";

export const metadata = generatePageMetadata("grants-pool/create");

export default function CreateGrantsPoolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}