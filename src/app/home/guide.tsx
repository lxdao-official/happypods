import CardBox from "~/components/card-box";

const Guide = () => {
  const steps = [
    {
      id: 1,
      title: "Create Application",
      description: "Submit Pod proposal with milestones",
      icon: "ri-file-add-line",
      color: "bg-blue-100 text-blue-600 border-blue-600",
    },
    {
      id: 2,
      title: "Setup Multi-sig",
      description: "Automated wallet creation & fund lock",
      icon: "ri-shield-check-line",
      color: "bg-green-100 text-green-600 border-green-600",
    },
    {
      id: 3,
      title: "Submit Deliverables",
      description: "Upload milestone completion proof",
      icon: "ri-upload-cloud-line",
      color: "bg-purple-100 text-purple-600 border-purple-600",
    },
    {
      id: 4,
      title: "Release Funds",
      description: "Automatic payment after approval",
      icon: "ri-money-dollar-circle-line",
      color: "bg-orange-100 text-orange-600 border-orange-600",
    },
  ];

  return (
    <div className="p-4 md:p-0">
      <CardBox title={<div className="text-2xl">How HappyPods Works</div>}>
        <div className="py-6">
          <p className="mb-20 text-center text-gray-600">
            Simple 4-step process for transparent grant management
          </p>

          {/* Desktop: Horizontal Flow with Arrows */}
          <div className="items-center justify-center px-6 space-y-10 md:px-0 md:space-x-4 md:flex md:space-y-0">
            {steps.map((step, index) => (
              <div key={step.id} className="items-center md:flex">
                <div className="flex flex-col items-center p-4 transition-shadow border border-black rounded-lg hover:shadow-lg group">
                  {/* Step Number */}
                  <div className="mt-[-38px] w-[50px] border border-black h-[40px] bg-[#fdeee2] text-black rounded-xl flex items-center justify-center text-xl font-bold mb-4">
                    {step.id}
                  </div>
                  
                  {/* Icon */}
                  <div className={`flex items-center justify-center w-16 h-16 mb-4 mt-8 transition-transform border rounded-full ${step.color} group-hover:scale-105`}>
                    <i className={`${step.icon} text-2xl`}></i>
                  </div>
                  
                  {/* Title */}
                  <h3 className="mb-2 text-lg font-semibold text-center transition-colors group-hover:text-primary">
                    {step.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-sm text-gray-600 text-center leading-relaxed max-w-[180px]">
                    {step.description}
                  </p>
                </div>
                
                {/* Horizontal Arrow */}
                {index < steps.length - 1 && (
                  <div className="items-center hidden px-4 md:flex">
                    <i className="text-2xl text-black ri-arrow-right-line"></i>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardBox>
    </div>
  );
};

export default Guide;