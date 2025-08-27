'use client'

import PodDetailPage from "./main";
import useStore from "~/store";

const Page = () => {
  const {podDetailRefreshKey} = useStore();
  return (
    <div>
      <PodDetailPage key={podDetailRefreshKey}/>
    </div>
  )
}

export default Page;