"use client";
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection } from "@heroui/react";
import { useState, useEffect, useCallback } from "react";
import { useAccount, useConnect, useDisconnect, useSignTypedData } from "wagmi";
import Link from "next/link";
import { api } from "~/trpc/react";
import { storeToken, storeUser, getUser, logout } from "~/lib/auth-storage";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { toast } from "sonner";
import { truncateString } from "~/lib/utils";

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

export function LoginModal() {
  const [isLoading, setIsLoading] = useState(false);
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
        name: result.user.name ?? ``,
        email: result.user.email ?? ``,
        role: result.user.role ?? "APPLICANT",
        address: result.user.address,
      };
      
      // 存储token和用户信息
      storeToken(result.token);
      storeUser(userInfo);
      // 更新本地状态
      setLoggedInUser(userInfo);
      setIsLoading(false);
      toast.success("logged in");
    },
    onError: (error) => {
      setIsLoading(false);
      toast.error(`login failed: ${error.message}`);
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

  // 处理签名登录流程
  const handleSignLogin = useCallback(async () => {
    try {
      if (!address) {
        throw new Error("unconnected wallet");
      }

      setIsLoading(true);

      // 1. 获取nonce
      const { data: nonce } = await refetchNonce();
      
      if (!nonce) {
        throw new Error("failed to get nonce");
      }

      // 2. 请求用户签名
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

      // 3. 验证签名
      await verifySignature.mutateAsync({
        address,
        signature,
        message: nonce.message,
        nonce: nonce.nonce,
      });

    } catch (error: unknown) {
      setIsLoading(false);
      console.error('Sign login error:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage?.includes('User rejected')) {
        toast.error("user rejected the signature");
      } else {
        toast.error(`login failed: ${errorMessage ?? "unknown error"}`);
      }
    }
  }, [address, refetchNonce, signTypedDataAsync, verifySignature]);

  // 处理登出
  const handleLogout = useCallback(() => {
    logout();
    disconnect();
    setLoggedInUser(null);
    toast.success("logged out");
  }, [disconnect]);

  // 钱包连接成功后自动触发签名流程
  useEffect(() => {
    if (isConnected && address && !isLoading && !loggedInUser) {
      console.log('Wallet connected, auto-triggering sign login...');
      void handleSignLogin();
    }
  }, [isConnected, address, isLoading, loggedInUser, handleSignLogin]);

  // 调试信息
  console.log('LoginModal render:', { 
    isLoading, 
    isConnected, 
    address: address?.slice(0, 6) + '...' + address?.slice(-4),
    loggedInUser: loggedInUser?.name 
  });

  return (
    <div>
      {loggedInUser ? (
        // 已登录用户显示下拉菜单
        <Dropdown className="text-black bg-foreground" placement="bottom-end">
          <DropdownTrigger>
            <Button variant="bordered" className="flex items-center space-x-2">
            <i className="text-xl ri-wallet-line"></i>
              <span>{loggedInUser.name || truncateString(loggedInUser.address, 6)}</span>
              <i className="text-xl ri-arrow-down-s-line"></i>
            </Button>
          </DropdownTrigger>

          <DropdownMenu>
            <DropdownSection>
              <DropdownItem key="profile" as={Link} href="/profile" className="py-2 my-2">
                📋 Profile
              </DropdownItem>
              <DropdownItem key="pods" as={Link} href="/my-pods" className="py-2 my-2">
                📦 My pods
              </DropdownItem>
              <DropdownItem key="logout" color="danger" onPress={handleLogout} className="py-2 my-2">
                🚪 Logout
              </DropdownItem>
            </DropdownSection>
          </DropdownMenu>
        </Dropdown>
      ) : (
        // 未登录用户显示连接按钮
        <div className="flex items-center gap-2">
          <ConnectButton />
        </div>
      )}
    </div>
  );
}