'use client'
import { DataDisplayGrid } from "~/components/data-display-grid";

const page = () => {
  return (
    <div className="container p-4 md:p-0">
      <DataDisplayGrid title="My Pods" type="my"/>
    </div>
  );
};

export default page;