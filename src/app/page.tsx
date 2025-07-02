import { HydrateClient } from "~/trpc/server";
import { UserForm } from "./_components/user-form";
import { LoginModal } from "./_components/login-modal";

export default async function Home() {
  return (
    <HydrateClient>
      <div className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white flex items-center justify-center">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold text-center mb-8">
              Welcome to <span className="text-violet-400">Happy Pods</span>
            </h1>
            <LoginModal />
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-6 text-center">用户信息管理</h2>
              <UserForm />
            </div>
          </div>
        </div>
      </div>
    </HydrateClient>
  );
}
