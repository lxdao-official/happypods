"use client";

const USER_KEY = "happy_pods_user_info";

export interface StoredUser {
  id: number;
  name: string;
  email: string;
  address: string;
}

// 存储用户信息（用于缓存展示）
export function storeUser(user: StoredUser): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

// 获取用户信息
export function getUser(): StoredUser | null {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr) as StoredUser;
      } catch (error) {
        console.error("Failed to parse user info:", error);
        return null;
      }
    }
  }
  return null;
}

// 清理本地缓存的用户信息
export function clearStoredUser(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(USER_KEY);
  }
}

// 自动从localStorage恢复登录状态
export function initializeAuth(): {
  isAuthenticated: boolean;
  user: StoredUser | null;
} {
  const user = getUser();

  return {
    isAuthenticated: !!user,
    user,
  };
}
