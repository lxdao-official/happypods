import { generatePageMetadata } from "~/lib/metadata";

export const metadata = generatePageMetadata("pods/create");

export default function CreatePodLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}