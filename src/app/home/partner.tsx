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
    <div className="flex flex-col items-center gap-4 p-6 mb-10">
        <img src="/partner.svg" alt="partner" className="w-[200px] md:h-[100px] md:mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-8 items-center gap-4 md:flex">
            {
                partners.map((partner, index) => (
                    <div key={index}>
                        <img src={partner.image} alt={partner.name} className="h-full"/>
                    </div>
                ))
            }
        </div>
    </div>
  );
}

export default Partner;