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
                <div key={step.id} className={`relative pr-6 ${index<3 ? 'border-r border-black' : ''}`}>
                    <div className="text-lg h-[120px]">{step.title}</div>
                    <div  className="text-[50px]">{step.icon}</div>
                    <div className="pt-6 mt-6 text-[60px] border-t-1 border-black">{step.id}</div>
                </div>
            ))
        }
      </div>
    </CardBox>
  );
};

export default Guide;