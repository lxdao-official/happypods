import CardBox from "~/components/card-box";

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
    <CardBox title={<div className="text-2xl">HappyPods Process</div>}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {
            steps.map((step, index) => (
                <div key={step.id} className={`relative flex flex-col items-center pr-6 ${index<3 ? 'border-r border-black' : ''}`}>
                    <div className="text-[60px] mb-8">{step.id}</div>
                    <div className="text-lg h-[100px] text-center">{step.title}</div>
                    <div  className="text-[60px]">{step.icon}</div>
                </div>
            ))
        }
      </div>
    </CardBox>
  );
};

export default Guide;