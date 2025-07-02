"use client";
import { Button, Modal, Loader, Text, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useSignTypedData } from "wagmi";
import { injected } from "wagmi/connectors";
import { api } from "~/trpc/react";
import { storeToken, getUser, logout } from "~/lib/auth-storage";

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
  const [opened, { open, close }] = useDisclosure(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(getUser());

  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { signTypedDataAsync } = useSignTypedData();

  // 获取nonce
  const { data: nonceData, refetch: refetchNonce } = api.auth.getNonce.useQuery(
    undefined,
    { enabled: false }
  );

  // 验证签名
  const verifySignature = api.auth.verifySignature.useMutation({
    onSuccess: (result) => {
      // 存储token和用户信息
      storeToken(result.token);
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

    } catch (error: any) {
      setIsLoading(false);
      console.error('Login error:', error);
      
      if (error.message?.includes('User rejected')) {
        alert("用户取消了签名");
      } else if (error.message?.includes('Connection')) {
        alert("钱包连接失败，请确保钱包已安装并解锁");
      } else {
        alert(`登录失败：${error.message || "未知错误"}`);
      }
    }
  };

  // 处理登出
  const handleLogout = () => {
    logout();
    disconnect();
    setLoggedInUser(null);
    close();
    alert("已登出");
  };

  // 钱包连接后自动继续登录流程
  useEffect(() => {
    if (isConnected && address && isLoading && loadingMessage.includes("等待钱包连接")) {
      handleLogin();
    }
  }, [isConnected, address]);

  return (
    <div>
      <Button onClick={open} variant={loggedInUser ? "outline" : "filled"}>
        {loggedInUser ? `${loggedInUser.name}` : "登录"}
      </Button>
      
      <Modal 
        opened={opened} 
        onClose={() => {
          if (!isLoading) close();
        }}
        title={loggedInUser ? "用户信息" : "Web3 登录"}
        closeOnClickOutside={!isLoading}
        closeOnEscape={!isLoading}
      >
        <Stack gap="md">
          {isLoading ? (
            // 加载状态
            <Stack align="center" gap="md">
              <Loader size="xl" />
              <Text ta="center">{loadingMessage}</Text>
              <Text size="sm" c="dimmed" ta="center">
                请确保钱包已解锁并按照提示完成操作
              </Text>
            </Stack>
          ) : loggedInUser ? (
            // 已登录状态
            <Stack gap="md">
              <div>
                <Text fw={500}>用户名：</Text>
                <Text>{loggedInUser.name}</Text>
              </div>
              <div>
                <Text fw={500}>钱包地址：</Text>
                <Text size="sm" style={{ wordBreak: "break-all" }}>
                  {loggedInUser.address}
                </Text>
              </div>
              <div>
                <Text fw={500}>角色：</Text>
                <Text>{loggedInUser.role}</Text>
              </div>
              <Button color="red" onClick={handleLogout} fullWidth>
                登出
              </Button>
            </Stack>
          ) : (
            // 未登录状态
            <Stack gap="md">
              <Text ta="center">
                使用您的Web3钱包登录Happy Pods
              </Text>
              <Text size="sm" c="dimmed" ta="center">
                我们将要求您签名一条消息来验证钱包所有权，这是安全且免费的。
              </Text>
              <Button onClick={handleLogin} fullWidth>
                {isConnected ? "签名登录" : "连接钱包"}
              </Button>
              {isConnected && (
                <Text size="sm" ta="center" c="green">
                  已连接钱包：{address?.slice(0, 6)}...{address?.slice(-4)}
                </Text>
              )}
            </Stack>
          )}
        </Stack>
      </Modal>
    </div>
  );
}