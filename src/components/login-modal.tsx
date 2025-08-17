"use client";
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
} from "@heroui/react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount, useSignTypedData } from "wagmi";
import Link from "next/link";
import { api } from "~/trpc/react";
import { storeToken, logout } from "~/lib/auth-storage";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import { delay_s, truncateString } from "~/lib/utils";
import { useUserInfo } from "~/hooks/useUserInfo";
import useStore from "~/store";

// 定义TypedData结构 - 需要与后端保持一致
const domain = {
  name: "HappyPods",
  version: "1",
} as const;

const types = {
  LoginMessage: [
    { name: "message", type: "string" },
    { name: "nonce", type: "string" },
    { name: "timestamp", type: "uint256" },
  ],
} as const;

export function LoginModal() {
  const [isLoading, setIsLoading] = useState(false);
  const { userInfo, fetchAndStoreUserInfo, handleLogout } = useUserInfo();
  const { userInfo: storeUserInfo } = useStore();

  const { address, isConnected } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();

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

        await delay_s(1000);
        window.location.reload();
        
      } catch (error) {
        console.error("Failed to fetch user info:", error);
        toast.error("Failed to fetch user info");
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

      // 1. 生成时间戳和消息
      const timestamp = Math.floor(Date.now() / 1000);
      const message = `welcome to HappyPods! please sign this message to verify your identity. Timestamp: ${timestamp}`;

      // 2. 请求用户签名
      const typedData = {
        domain,
        types,
        primaryType: "LoginMessage" as const,
        message: {
          message,
          nonce: timestamp.toString(),
          timestamp: BigInt(timestamp),
        },
      };

      const signature = await signTypedDataAsync(typedData);

      // 3. 验证签名
      await verifySignature.mutateAsync({
        address,
        signature,
        message,
        timestamp,
      });
      
    } catch (error: unknown) {
      setIsLoading(false);
      console.error("Sign login error:", error);

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage?.includes("User rejected")) {
        toast.error("user rejected the signature");
      } else {
        toast.error(`login failed: ${errorMessage ?? "unknown error"}`);
      }
    }
  }, [address, signTypedDataAsync, verifySignature]);

  // 钱包连接成功后自动触发签名流程
  useEffect(() => {
    if (isConnected && address && !isLoading && !userInfo) {
      console.log("Wallet connected, auto-triggering sign login...");
      void handleSignLogin();
    }
  }, [isConnected, address, isLoading, userInfo, handleSignLogin]);

  const username = useMemo(() => {
    if (userInfo) {
      const wallet = truncateString(userInfo.address);
      return userInfo.name ? `${userInfo.name} (${wallet})` : wallet;
    }
    return "";
  }, [userInfo]);

  // 下拉菜单项配置
  const dropdownItems = [
    {
      key: "profile",
      href: "/profile",
      icon: "📋",
      label: "Profile",
    },
    {
      key: "pods",
      href: "/my-pods",
      icon: "📦",
      label: "My pods",
    },
    {
      key: "my-grants-pool",
      href: "/my-grants-pool",
      icon: "💰",
      label: "My Grants Pool",
    },
    {
      key: "logout",
      icon: "🚪",
      label: "Logout",
      color: "danger" as const,
      onPress: handleLogout,
    },
  ];

  return (
    <div>
      {userInfo ? (
        // 已登录用户显示下拉菜单
        <Dropdown className="text-black bg-foreground" placement="bottom-end">
          <DropdownTrigger>
            <Button variant="bordered" className="flex items-center space-x-1">
              {storeUserInfo?.avatar ? (
                <img
                  src={storeUserInfo.avatar}
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
              {dropdownItems.map((item) => (
                <DropdownItem
                  key={item.key}
                  as={item.href ? Link : undefined}
                  href={item.href}
                  color={item.color}
                  onPress={item.onPress}
                  className="py-2 my-2"
                >
                  {item.icon} {item.label}
                </DropdownItem>
              ))}
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
