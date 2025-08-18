import { Highlighter } from "~/components/highlighter";

const Banner = () => {
  return (
    <div className="flex items-center banner py-[100px] md:py-[300px]">
      <div className="py-10 text-2xl md:text-4xl md:leading-[60px] text-center">
        <Highlighter action="underline" color="#FF9800">HappyPod</Highlighter>
        &nbsp; supply funding, resources, and guidance to promising projects,  helping them grow into 
        <Highlighter action="circle" color="#87CEFA">
         successful
        </Highlighter>
        initiatives.
        </div>
    </div>
  );
} 

export default Banner;