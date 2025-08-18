import { Button } from "@heroui/button";
import Link from "next/link";
import AppBtn from "~/components/app-btn";

const Solve = () => {
  return (
    <div className="flex flex-col md:flex-row p-6 items-center justify-between md:py-[150px] md:space-x-8">
      <div className="space-y-4">
        <div className="text-4xl text-purple-400">Problem We Solve？</div>
        <p className="leading-8">HappyPods is  lightweight, self-organizing working groups. <br/>They supply funding, resources, and guidance to promising projects, helping them grow into successful initiatives.</p>
        <div className="flex space-x-4 items-center justify-center md:justify-start w-full">
          <Link href="/grants-pool"><AppBtn>Apply Pod</AppBtn></Link>
          <Link href="/grants-pool/create"><AppBtn btnProps={{color:"success"}}>Create Grant Pool</AppBtn></Link>
        </div>
      </div>
      <img src="/banner1.svg" alt="solve"  className="md:w-[400px] w-[80%]"/>
    </div>
  );
} 

export default Solve;