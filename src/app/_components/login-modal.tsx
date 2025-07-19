"use client";
import { Button, Modal, Spinner, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection } from "@heroui/react";
import { useState, useEffect, useRef } from "react";
import { useAccount, useConnect, useDisconnect, useSignTypedData } from "wagmi";
import { injected } from "wagmi/connectors";
import Link from "next/link";
import { api } from "~/trpc/react";
import { storeToken, storeUser, getUser, logout } from "~/lib/auth-storage";

// 定义TypedData结构 - 需要与后端保持一致
const domain = {
  name: 'Happy Pods',
  version: '1',
} as const;

const types = {
  LoginMessage: [
    { name: 'message', type: 'string' },
    { name: 'nonce', type: 'string' },
    { name: 'timestamp', type: 'uint256' },
  ],
} as const;

// 自定义 useDisclosure hook
function useDisclosure(initial = false) {
  const [opened, setOpened] = useState(initial);
  const open = () => setOpened(true);
  const close = () => setOpened(false);
  const toggle = () => setOpened(!opened);
  return [opened, { open, close, toggle }] as const;
}

export function LoginModal() {
  const [opened, { open, close }] = useDisclosure(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(getUser());

  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { signTypedDataAsync } = useSignTypedData();

  // 获取nonce
  const { refetch: refetchNonce } = api.auth.getNonce.useQuery(
    undefined,
    { enabled: false }
  );

  // 验证签名
  const verifySignature = api.auth.verifySignature.useMutation({
    onSuccess: (result) => {
      // 处理用户信息，确保符合StoredUser接口
      const userInfo = {
        id: result.user.id,
        name: result.user.name ?? `用户 ${result.user.address.slice(0, 6)}...${result.user.address.slice(-4)}`,
        email: result.user.email ?? `${result.user.address.toLowerCase()}@wallet.local`,
        role: result.user.role ?? "APPLICANT",
        address: result.user.address,
      };
      
      // 存储token和用户信息
      storeToken(result.token);
      storeUser(userInfo);
      // 更新本地状态
      setLoggedInUser(userInfo);
      setIsLoading(false);
      close();
      alert("登录成功！");
    },
    onError: (error) => {
      setIsLoading(false);
      alert(`登录失败：${error.message}`);
    },
  });

  // 检查登录状态
  useEffect(() => {
    setLoggedInUser(getUser());
  }, []);

  // 监听存储变化（跨标签页同步）
  useEffect(() => {
    const handleStorageChange = () => {
      setLoggedInUser(getUser());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 处理登录流程
  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setLoadingMessage("正在连接钱包...");

      // 1. 连接钱包
      if (!isConnected) {
        connect({ connector: injected() });
        setLoadingMessage("等待钱包连接...");
        return;
      }

      if (!address) {
        throw new Error("未获取到钱包地址");
      }

      // 2. 获取nonce
      setLoadingMessage("获取签名信息...");
      const { data: nonce } = await refetchNonce();
      
      if (!nonce) {
        throw new Error("获取nonce失败");
      }

      // 3. 请求用户签名
      setLoadingMessage("请在钱包中完成签名验证...");
      
      const typedData = {
        domain,
        types,
        primaryType: 'LoginMessage' as const,
        message: {
          message: nonce.message,
          nonce: nonce.nonce,
          timestamp: BigInt(nonce.timestamp),
        },
      };

      const signature = await signTypedDataAsync(typedData);

      // 4. 验证签名
      setLoadingMessage("验证签名中...");
      await verifySignature.mutateAsync({
        address,
        signature,
        message: nonce.message,
        nonce: nonce.nonce,
      });

    } catch (error: unknown) {
      setIsLoading(false);
      console.error('Login error:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage?.includes('User rejected')) {
        alert("用户取消了签名");
      } else if (errorMessage?.includes('Connection')) {
        alert("钱包连接失败，请确保钱包已安装并解锁");
      } else {
        alert(`登录失败：${errorMessage ?? "未知错误"}`);
      }
    }
  };

  // 处理登出
  const handleLogout = () => {
    logout();
    disconnect();
    setLoggedInUser(null);
    alert("已登出");
  };

  // 钱包连接后自动继续登录流程
  useEffect(() => {
    if (isConnected && address && isLoading && loadingMessage.includes("等待钱包连接")) {
      void handleLogin();
    }
  }, [isConnected, address, isLoading, loadingMessage, handleLogin]);

  return (
    <div>
      {loggedInUser ? (
        // 已登录用户显示下拉菜单
        <Dropdown>
          <DropdownTrigger>
            <Button variant="bordered" className="flex items-center space-x-2">
              {loggedInUser.name}
              <span className="ml-1">▼</span>
            </Button>
          </DropdownTrigger>

          <DropdownMenu>
            <DropdownSection title="我的账户">
              <DropdownItem key="profile" as={Link} href="/profile">
                📋 个人资料
              </DropdownItem>
              <DropdownItem key="pods" as={Link} href="/my-pods">
                📦 我的 Pods
              </DropdownItem>
            </DropdownSection>
            <DropdownSection>
              <DropdownItem key="logout" color="danger" onClick={handleLogout}>
                🚪 登出
              </DropdownItem>
            </DropdownSection>
          </DropdownMenu>
        </Dropdown>
      ) : (
        // 未登录用户显示登录按钮
        <Button onClick={open} variant="solid">
          登录
        </Button>
      )}
      
      <Modal 
        isOpen={opened} 
        onClose={() => {
          if (!isLoading) close();
        }}
        title="Web3 登录"
        isDismissable={!isLoading}
        hideCloseButton={isLoading}
      >
        <div className="space-y-4">
          {isLoading ? (
            // 加载状态
            <div className="flex flex-col items-center space-y-4">
              <Spinner size="lg" />
              <p className="text-center">{loadingMessage}</p>
              <p className="text-sm text-muted-foreground text-center">
                请确保钱包已解锁并按照提示完成操作
              </p>
            </div>
          ) : (
            // 未登录状态
            <div className="space-y-4">
              <p className="text-center">
                使用您的Web3钱包登录Happy Pods
              </p>
              <p className="text-sm text-muted-foreground text-center">
                我们将要求您签名一条消息来验证钱包所有权，这是安全且免费的。
              </p>
              <Button onClick={handleLogin} className="w-full">
                {isConnected ? "签名登录" : "连接钱包"}
              </Button>
              {isConnected && (
                <p className="text-sm text-center text-success">
                  已连接钱包：{address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}