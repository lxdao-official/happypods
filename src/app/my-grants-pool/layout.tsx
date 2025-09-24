import { generatePageMetadata } from "~/lib/metadata";

export const metadata = generatePageMetadata("my-grants-pool");

export default function MyGrantsPoolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}