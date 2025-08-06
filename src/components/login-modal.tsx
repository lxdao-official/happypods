"use client";
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection } from "@heroui/react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount, useConnect, useDisconnect, useSignTypedData } from "wagmi";
import Link from "next/link";
import { api } from "~/trpc/react";
import { storeToken, logout } from "~/lib/auth-storage";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { toast } from "sonner";
import { truncateString } from "~/lib/utils";
import { useUserInfo } from "~/app/hooks/useUserInfo";
import useStore from "~/store";

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
  const { userInfo, fetchAndStoreUserInfo, handleLogout } = useUserInfo();
  const { userInfo: storeUserInfo } = useStore();

  const { address, isConnected } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();

  // 获取nonce
  const { refetch: refetchNonce } = api.auth.getNonce.useQuery(
    undefined,
    { enabled: false }
  );

  // 验证签名
  const verifySignature = api.auth.verifySignature.useMutation({
    onSuccess: async (result) => {
      // 只存储token
      storeToken(result.token);
      toast.success("logged in");
      
      // 登录成功后获取用户信息
      try {
        await fetchAndStoreUserInfo();
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch user info:', error);
        toast.error('Failed to fetch user info');
        setIsLoading(false);
      }
    },
    onError: (error) => {
      setIsLoading(false);
      toast.error(`login failed: ${error.message}`);
    },
  });



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

  // 钱包连接成功后自动触发签名流程
  useEffect(() => {
    if (isConnected && address && !isLoading && !userInfo) {
      console.log('Wallet connected, auto-triggering sign login...');
      void handleSignLogin();
    }
  }, [isConnected, address, isLoading, userInfo, handleSignLogin]);

  const username = useMemo(()=>{
    if(userInfo){
      const wallet = truncateString(userInfo.address, 6);
      return userInfo.name ? `${userInfo.name} (${wallet})` : wallet
    }
    return ''
  },[userInfo])

  // 获取用户头像（优先显示头像）
  const getUserAvatar = () => {
    return storeUserInfo?.avatar || null;
  };

  return (
    <div>
      {userInfo ? (
        // 已登录用户显示下拉菜单
        <Dropdown className="text-black bg-foreground" placement="bottom-end">
          <DropdownTrigger>
            <Button variant="bordered" className="flex items-center space-x-1">
              {getUserAvatar() ? (
                <img 
                  src={getUserAvatar()!} 
                  alt="User Avatar" 
                  className="w-5 h-5 rounded-full"
                />
              ) : (
                <i className="text-xl ri-wallet-line"></i>
              )}
              <span>{username}</span>
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
              <DropdownItem key="my-grants-pool" as={Link} href="/my-grants-pool" className="py-2 my-2">
                💰 My Grants Pool
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
          <ConnectButton showBalance={false} chainStatus="none" />
        </div>
      )}
    </div>
  );
}