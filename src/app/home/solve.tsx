import { Button } from "@heroui/button";
import AppBtn from "~/components/app-btn";

const Solve = () => {
  return (
    <div className="flex items-center justify-between py-[150px] space-x-8">
      <div className="space-y-4">
        <div className="text-4xl text-purple">Problem We Solve？</div>
        <p className="leading-8">HappyPods is  lightweight, self-organizing working groups. <br/>They supply funding, resources, and guidance to promising projects, helping them grow into successful initiatives.</p>
        <div className="flex space-x-4">
          <AppBtn>Apply Pod</AppBtn>
          <AppBtn btnProps={{color:"success"}}>Create Grant Pool</AppBtn>
        </div>
      </div>
      <img src="/solve.png" alt="solve"  className="w-[300px]"/>
    </div>
  );
} 

export default Solve;