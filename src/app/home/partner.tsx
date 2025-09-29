const partners = [
    {
        name: "lxdao",
        image: "/lxdao.svg",
        url: "https://lxdao.io/"
    },{
        name: "lxdao",
        image: "/ethpanda.svg",
        url: "https://ethpanda.org/"
    },{
        name: "Intensive Co-learning",
        image: "/intensivecolearn.svg",
        url: "https://intensivecolearn.ing/"
    }
]
const Partner = () => {
  return (
    <div className="flex flex-col items-center gap-4 p-6 py-20">
        <img src="/partner.svg" alt="partner" className="w-[200px] md:h-[100px] md:mb-4" />
        <div className="grid items-center grid-cols-2 gap-6 md:grid-cols-8 md:flex">
            {
                partners.map((partner, index) => (
                    <div key={index}>
                        <a href={partner.url} target="_blank" rel="noopener noreferrer">
                            <img src={partner.image} alt={partner.name} className="h-full transition-all hover:scale-105"/>
                        </a>
                    </div>
                ))
            }
        </div>
    </div>
  );
}

export default Partner;