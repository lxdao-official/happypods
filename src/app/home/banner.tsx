import { Highlighter } from "~/components/highlighter";
import { MorphingText } from "~/components/morphing-text";
const Banner = () => {
  return (
    <div className="flex flex-col items-center py-[100px] md:py-[300px] md:min-h-screen space-y-2 px-2">
      {/* <img src="/logo.svg" className="h-[100px]" /> */}
      <MorphingText texts={["GM 👋", "Welcome to HappyPods ~"]} className="!text-[25px] md:!text-[50px] text-nowrap text-primary" />
      <div className="py-10 text-2xl md:text-4xl leading-[45px] md:leading-[80px] text-center">
        <Highlighter action="box" color="#ff6b6b"> &nbsp;HappyPods  &nbsp;</Highlighter>
        &nbsp;
        makes micro-grants <Highlighter action="underline" color="#2d62cc">simple and efficient </Highlighter>, 
        enabling transparent and trackable funding distribution through multi-sig automation, accelerating community 
        &nbsp;
        <Highlighter action="highlight" color="#6bff8b65">&nbsp;&nbsp;innovation and growth.</Highlighter>
        </div>
    </div>
  );
} 

export default Banner;