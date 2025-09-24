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
    <div className="flex flex-col items-center gap-4 p-6 py-20">
        <img src="/partner.svg" alt="partner" className="w-[200px] md:h-[100px] md:mb-4" />
        <div className="grid items-center grid-cols-2 gap-4 md:grid-cols-8 md:flex">
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