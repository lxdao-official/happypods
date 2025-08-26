"use client";

import Banner from "~/app/home/banner";
import Guide from "~/app/home/guide";
import Solve from "~/app/home/solve";
import Partner from "./home/partner";
import Contributors from "./home/contributors";
// import {SafeTransactionExample} from "~/components/test/safe-transaction-example";


export default function HomePage() {
  return (
    <main className="container min-h-screen">
      {/* <Test/> */}
      {/* <SafeTransactionExample/> */}
      <Banner />
      <Guide />
      <Solve />
      <Contributors />
      <Partner />
    </main>
  );
}
