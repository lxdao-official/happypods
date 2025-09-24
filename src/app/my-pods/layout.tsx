import { generatePageMetadata } from "~/lib/metadata";

export const metadata = generatePageMetadata("my-pods");

export default function MyPodsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}