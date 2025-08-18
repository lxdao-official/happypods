"use client";

import Banner from "~/app/home/banner";
import Guide from "~/app/home/guide";
import Solve from "~/app/home/solve";
import Partner from "./home/partner";

export default function HomePage() {
  return (
    <main className="container min-h-screen">
      <Banner />
      <Guide />
      <Solve />
      <Partner />
    </main>
  );
}
