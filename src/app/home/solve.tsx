import { Button } from "@heroui/button";
import Link from "next/link";
import AppBtn from "~/components/app-btn";

const Solve = () => {
  return (
    <div className="flex flex-col md:flex-row p-6 items-center justify-between md:py-[150px] md:space-x-8">
      <div className="space-y-4">
        <div className="text-4xl text-primary">Problems We Solve</div>
        <p className="text-xl leading-8">Traditional grant processes are lengthy and complex with long approval cycles. <br/>HappyPods specializes in fast, small-amount funding for MVP products and quick idea validation, making Web3 community building more accessible and transparent.</p>
        <div className="flex items-center justify-center w-full space-x-4 md:justify-start">
          <Link href="/grants-pool"><AppBtn btnProps={{color:'primary'}}>Apply Pod</AppBtn></Link>
          <Link href="/grants-pool/create"><AppBtn btnProps={{color:"success"}}>Create Grant Pool</AppBtn></Link>
        </div>
      </div>
      <img src="/banner1.svg" alt="solve"  className="md:w-[400px] w-[80%]"/>
    </div>
  );
} 

export default Solve;