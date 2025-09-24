import Banner from "~/app/home/banner";
import Guide from "~/app/home/guide";
import Solve from "~/app/home/solve";
import Partner from "./home/partner";
import Contributors from "./home/contributors";
import { generatePageMetadata } from "~/lib/metadata";

export const metadata = generatePageMetadata("home");

export default function HomePage() {
  return (
    <main className="container min-h-screen">
      <Banner />
      <Guide />
      <Solve />
      <Contributors />
      <Partner />
    </main>
  );
}
