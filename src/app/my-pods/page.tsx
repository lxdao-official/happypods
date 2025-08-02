'use client'
import { DataDisplayGrid } from "~/components/data-display-grid";

const page = () => {
  return (
    <div className="container">
      <DataDisplayGrid title="My Pods" type="my"/>
    </div>
  );
};

export default page;