const partners = [
    {
        name: "lxdao",
        image: "/lxdao.svg"
    },{
        name: "lxdao",
        image: "/lxdao.svg"
    },{
        name: "lxdao",
        image: "/lxdao.svg"
    }
]
const Partner = () => {
  return (
    <div className="flex flex-col items-center gap-4 pt-[60px] pb-[100px]">
        <img src="/partner.svg" alt="partner" className="h-[100px] mb-8" />
        <div className="flex items-center space-x-6">
            {
                partners.map((partner, index) => (
                    <div key={index}>
                        <img src={partner.image} alt={partner.name} className="h-[60px]"/>
                    </div>
                ))
            }
        </div>
    </div>
  );
}

export default Partner;