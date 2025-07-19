import Link from "next/link";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
  return (
    <HydrateClient>
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-6 text-gray-900">
            欢迎来到 <span className="text-violet-600">Happy Pods</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Happy Pods 是一个去中心化的资助管理平台，连接资助方（Grants Pool）和项目申请者。
            我们致力于创建一个透明、高效的资助生态系统。
          </p>
          
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <h2 className="text-2xl font-bold mb-4 text-blue-600">
                Grants Pool
              </h2>
              <p className="text-gray-600 mb-4">
                创建和管理资助池，为优秀项目提供资金支持
              </p>
              <Link
                href="/grants-pool/create"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                创建 Grants Pool
              </Link>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <h2 className="text-2xl font-bold mb-4 text-green-600">
                Pod 项目
              </h2>
              <p className="text-gray-600 mb-4">
                申请资助，展示您的创新项目和想法
              </p>
              <Link
                href="/pods/create"
                className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                创建 Pod 项目
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/grants-pool"
              className="bg-gray-100 text-gray-800 px-8 py-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              浏览 Grants Pool
            </Link>
            <Link
              href="/pods"
              className="bg-gray-100 text-gray-800 px-8 py-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              浏览 Pod 项目
            </Link>
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
