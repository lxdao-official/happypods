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
import { createConfig, http, useAccount, useDisconnect, useEnsName, useSignTypedData } from "wagmi";
import Link from "next/link";
import { api } from "~/trpc/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import { delay_s, truncateString } from "~/lib/utils";
import { useUserInfo } from "~/hooks/useUserInfo";
import useStore from "~/store";
import { useMobile } from "~/hooks/useMobile";
import { mainnet } from "viem/chains";
import LazyImage from "./LazyImage";

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

const ENSConfig = createConfig({
  chains: [mainnet,],
  transports: {
    [mainnet.id]: http(),
  },
})

export function LoginModal() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasRejectedSignature, setHasRejectedSignature] = useState(false);
  const [hasAttemptedAutoLogin, setHasAttemptedAutoLogin] = useState(false);
  const { userInfo, fetchAndStoreUserInfo, handleLogout } = useUserInfo();
  const { userInfo: storeUserInfo } = useStore();

  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { signTypedDataAsync } = useSignTypedData();
  const nonceQuery = api.auth.getNonce.useQuery(undefined, { enabled: false });

  // 验证签名
  const verifySignature = api.auth.verifySignature.useMutation({
    onSuccess: async () => {
      toast.success("Logged success");

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
      toast.error(`login failed:: ${error.message}`);
    },
  });


  // 处理签名登录流程
  const handleSignLogin = useCallback(async (isAutoTrigger = false) => {
    try {
      if (!address) {
        throw new Error("unconnected wallet");
      }

      setIsLoading(true);
      
      // 如果是自动触发，标记为已尝试
      if (isAutoTrigger) {
        setHasAttemptedAutoLogin(true);
      }

      // 1. 生成时间戳和消息
      const timestamp = Math.floor(Date.now() / 1000);
      const message = `welcome to HappyPods! please sign this message to verify your identity. Timestamp: ${timestamp}`;

      // 2. 请求一次性 nonce
      const { data: nonceResponse } = await nonceQuery.refetch();
      if (!nonceResponse?.nonce) {
        throw new Error("Failed to obtain nonce, please try again");
      }

      // 2. 请求用户签名
      const typedData = {
        domain,
        types,
        primaryType: "LoginMessage" as const,
        message: {
          message,
          nonce: nonceResponse.nonce,
          timestamp: BigInt(timestamp),
        },
      };

      const signature = await signTypedDataAsync(typedData);

      // 3. 验证签名
      await verifySignature.mutateAsync({
        address,
        signature,
        message,
        nonce: nonceResponse.nonce,
        timestamp,
      });
      
      // 登录成功后重置拒绝状态
      setHasRejectedSignature(false);
      
    } catch (error: unknown) {
      setIsLoading(false);
      // 无论什么错误都断开连接并重置状态
      disconnect();
      setHasAttemptedAutoLogin(false);
      setHasRejectedSignature(false);
    }
  }, [address, signTypedDataAsync, verifySignature]);



  const ENSName = useEnsName({address:userInfo?.address as `0x${string}`,config:ENSConfig})

  // 钱包连接成功后自动触发签名流程（仅触发一次，用户拒绝后不再自动触发）
  useEffect(() => {
    if (isConnected && address && !isLoading && !userInfo && !hasRejectedSignature && !hasAttemptedAutoLogin) {
      console.log("Wallet connected, auto-triggering sign login...");
      void handleSignLogin(true);
    }
  }, [isConnected, address, isLoading, userInfo, hasRejectedSignature, hasAttemptedAutoLogin, handleSignLogin]);

  // 当地址变化时重置状态，允许新钱包重新尝试自动登录
  useEffect(() => {
    setHasRejectedSignature(false);
    setHasAttemptedAutoLogin(false);
  }, [address]);

  const username = useMemo(() => {
    if (userInfo) {
      const wallet = truncateString(userInfo.address);
      return userInfo.name ? `${userInfo.name} (${ENSName.data || wallet})` : (ENSName.data || wallet);
    }
    return "";
  }, [userInfo, ENSName]);

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

  const isMobile = useMobile();

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === "authenticated");

        return (
          <div>
            {(() => {
              // 未连接状态：显示连接钱包按钮
              if (!connected) {
                return (
                  <Button
                    variant="faded"
                    size={isMobile ? "sm" : "md"}
                    onPress={openConnectModal}
                    className="flex items-center gap-2"
                  >
                    <i className="text-xl ri-wallet-line"></i>
                    <span className="hidden md:block">Connect Wallet</span>
                  </Button>
                );
              }

              // 网络错误状态：显示切换网络按钮
              if (chain.unsupported) {
                return (
                  <Button
                    variant="faded"
                    color="danger"
                    size={isMobile ? "sm" : "md"}
                    onPress={openChainModal}
                    className="flex items-center gap-2"
                  >
                    <i className="text-xl ri-error-warning-line"></i>
                    <span className="hidden md:block">Network Error</span>
                  </Button>
                );
              }

              // 已连接但未登录状态：显示签名登录按钮
              if (!userInfo) {
                return (
                  <Button
                    variant="faded"
                    size={isMobile ? "sm" : "md"}
                    onPress={() => handleSignLogin(false)}
                    isLoading={isLoading}
                    className="flex items-center gap-2"
                  >
                    {!isLoading && (
                      <i className={`text-xl ri-quill-pen-ai-line`}></i>
                    )}
                    <span className="hidden md:block">
                      Sign Login ({truncateString(address || '')})
                    </span>
                  </Button>
                );
              }

              // 已登录状态：显示用户信息下拉菜单
              return (
                <Dropdown className="text-black bg-background" placement="bottom-end">
                  <DropdownTrigger>
                    <Button variant="faded" className="flex items-center md:space-x-1" size={isMobile ? "sm" : "md"}>
                      {storeUserInfo?.avatar ? (
                        <LazyImage
                          src={storeUserInfo.avatar}
                          alt="User Avatar"
                          className="object-contain w-5 h-5 rounded-full"
                        />
                      ) : (
                        <i className="text-xl ri-wallet-line"></i>
                      )}
                      <span className="hidden md:block">{username}</span>
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
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
