import { generatePageMetadata } from "~/lib/metadata";

export const metadata = generatePageMetadata("profile");

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}