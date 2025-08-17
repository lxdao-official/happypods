"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useDisconnect, useSwitchAccount } from "wagmi";
import { api } from "~/trpc/react";
import { storeUser, getUser, type StoredUser, logout } from "~/lib/auth-storage";
import useStore from "~/store";
import { toast } from "sonner";
import { delay_s } from "~/lib/utils";
import { PLATFORM_MOD_ADDRESS } from "~/lib/config";

export function useUserInfo() {
  const [userInfo, setUserInfo] = useState<StoredUser | null>(getUser());
  const { setUserInfo: setStoreUserInfo } = useStore();
  const { address } = useAccount();

  // 获取当前用户信息（通过 getMe 接口）
  const { data: currentUser, refetch: refetchUser } = api.user.getMe.useQuery(
    undefined,
    { enabled: !!userInfo?.id }
  );

  // 获取并存储用户信息
  const fetchAndStoreUserInfo = async () => {
    try {
      const userData = await refetchUser();
      if (userData.data) {
        const storedUserInfo: StoredUser = {
          id: userData.data.id,
          name: userData.data.name ?? '',
          email: userData.data.email ?? '',
          role: userData.data.role ?? "APPLICANT",
          address: address ?? '', // 使用当前连接的钱包地址
        };
        
        // 存储用户信息到localStorage
        storeUser(storedUserInfo);
        setUserInfo(storedUserInfo);
        
        // 存储完整用户信息到 zustand store（需要补充缺失字段）
        const fullUserInfo = {
          ...userData.data,
          walletAddress: address ?? '',
          description: userData.data.name ?? '', // 临时使用name作为description
          links: {},
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setStoreUserInfo(fullUserInfo);
        
        return storedUserInfo;
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      throw error;
    }
  };

  // 当获取到新的用户数据时，更新本地存储
  useEffect(() => {
    if (currentUser && currentUser.id && address) {
      const storedUserInfo: StoredUser = {
        id: currentUser.id,
        name: currentUser.name ?? '',
        email: currentUser.email ?? '',
        role: currentUser.role ?? 'APPLICANT',
        address: address,
      };
      storeUser(storedUserInfo);
      setUserInfo(storedUserInfo);
    }
  }, [currentUser, address]);

  // 监听存储变化（跨标签页同步）
  useEffect(() => {
    const handleStorageChange = () => {
      setUserInfo(getUser());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);


// 处理登出
const { disconnect } = useDisconnect();
const handleLogout = useCallback(async() => {
    logout();
    disconnect();
    setStoreUserInfo(null);
    toast.success("logged out");
    await delay_s();
    window.location.reload();
  }, [disconnect]);

  // 监听钱包如果被切换则退出登录
  useEffect(()=>{
    if(address && userInfo && address !== userInfo?.address){
      handleLogout();
    }
  },[address]);

  // 当前用户是平台管理员
  const isPlatformAdmin = useMemo(()=>{
    return userInfo && userInfo?.address === PLATFORM_MOD_ADDRESS;
  },[userInfo]);

  return {
    userInfo,
    setUserInfo,
    fetchAndStoreUserInfo,
    refetchUser,
    handleLogout,
    isPlatformAdmin,
    address
  };
}