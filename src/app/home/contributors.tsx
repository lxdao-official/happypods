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
                                    <div className="absolute p-1 bg-white rounded-full -bottom-1 -right-1">
                                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                    </div>
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
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                            </svg>
                            View on GitHub
                        </a>
                    </div>
                </div>
            </CardBox>
        </div>
    );
};

export default Contributors;