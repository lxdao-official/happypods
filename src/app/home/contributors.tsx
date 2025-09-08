import CardBox from "~/components/card-box";

interface GitHubContributor {
    login: string;
    avatar_url: string;
    html_url: string;
}

interface Contributor extends GitHubContributor {
    type: 'Development' | 'Design' | 'Idea' | 'Documentation';
}

// 贡献者数据 - 基于实际的 LXDAO 和 HappyPods 项目贡献者
const contributors: Contributor[] = [
    {
        login: "Keylen",
        avatar_url: "https://avatars.githubusercontent.com/u/17230944?v=4",
        html_url: "https://github.com/BiscuitCoder",
        type: "Development"
    },
    {
        login: "Bruce Xu",
        avatar_url: "https://avatars.githubusercontent.com/u/95468177?v=4",
        html_url: "https://github.com/brucexu-eth",
        type: "Idea"
    },
    {
        login: "Marcus",
        avatar_url: "https://avatars.githubusercontent.com/u/69314554?v=4",
        html_url: "https://github.com/MRzzz-cyber",
        type: "Idea"
    },
    {
        login: "JIWEN",
        avatar_url: "https://cdn.lxdao.io/9a8d84c8-17e6-4433-ae05-97e42bae42f2.jpg",
        html_url: "",
        type: "Design"
    }
];

const getTypeColor = (type: string) => {
    switch (type) {
        case 'Development':
            return 'bg-blue-100 text-blue-800';
        case 'Design':
            return 'bg-purple-100 text-purple-800';
        case 'Idea':
            return 'bg-yellow-100 text-yellow-800';
        case 'Documentation':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const Contributors = () => {

    return (
        <div className="p-4 md:p-0">
            <CardBox title={<div className="text-2xl">Our Contributors</div>} titleBg="#b47bf9">
                <div className="py-6">
                    <p className="mb-8 text-center text-gray-600">
                        Thanks to all the amazing people who have contributed to HappyPods
                    </p>
                    <div className="grid grid-cols-2 gap-6 px-4 md:px-10 md:grid-cols-4">
                        {contributors.map((contributor) => (
                            <div
                                key={contributor.login}
                                className="flex flex-col items-center p-4 transition-shadow border border-black rounded-lg cursor-pointer hover:shadow-lg group"
                                onClick={() => window.open(contributor.html_url, '_blank')}
                            >
                                <div className="relative mb-3">
                                    <img
                                        src={contributor.avatar_url}
                                        alt={contributor.login}
                                        className="w-16 h-16 transition-transform rounded-full group-hover:scale-110"
                                    />
                                </div>
                                <h3 className="mb-2 text-sm font-semibold text-center transition-colors group-hover:text-purple-600">
                                    {contributor.login}
                                </h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(contributor.type)}`}>
                                    {contributor.type}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 text-center">
                        <a
                            href="https://github.com/lxdao-official/happypods"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 text-white transition-colors bg-gray-900 rounded-lg hover:bg-gray-800"
                        >
                            <i className="mr-2 text-2xl text-white ri-github-fill"></i>
                            View on GitHub
                        </a>
                    </div>
                </div>
            </CardBox>
        </div>
    );
};

export default Contributors;