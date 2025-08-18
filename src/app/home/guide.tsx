import CardBox from "~/components/card-box";
import EdgeLine from "~/components/edge-line";

    const Guide = () => {
  const steps = [
    {
      id: 1,
      title: "Submit a proposal for your project ideas",
      icon: "💻",
    },
    {
      id: 2,
      title: "Wait for your proposal to be reviewed by grants providers",
      icon: "🔍",
    },
    {
      id: 3,
      title: "Update milestone progress",
      icon: "📊",
    },
    {
      id: 4,
      title: "Unlock grants upon milestone review",
      icon: "💰",
    },
  ];

  return (
    <div className="p-4 md:p-0">
        <CardBox title={<div className="text-2xl">HappyPods Process</div>}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4 py-4 md:py-0">
          {
              steps.map((step, index) => (
                  <div key={step.id} className={`relative flex flex-col items-center md:pr-6 ${index<3 ? 'md:border-r border-black' : ''}`}>
                      <div className="text-[60px] mb-8">{step.id}</div>
                      <div className="text-lg md:h-[100px] text-center px-4 md:px-0">{step.title}</div>
                      <div  className="text-[60px]">{step.icon}</div>
                     
                    {
                       index<3 && 
                       <div className="px-4 py-2 w-full md:hidden">
                          <EdgeLine color="#000000"/>
                      </div>
                    }
                  </div>
              ))
          }
        </div>
      </CardBox>
    </div>
  );
};

export default Guide;