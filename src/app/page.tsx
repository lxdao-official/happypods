"use client";

import Banner from "~/app/home/banner";
import Guide from "~/app/home/guide";
import Solve from "~/app/home/solve";
import Partner from "./home/partner";
import Contributors from "./home/contributors";
import { useSEO } from "~/hooks/useSeo";


export default function HomePage() {
  useSEO("home");

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
