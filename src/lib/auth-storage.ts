"use client";

const TOKEN_KEY = 'happy_pods_jwt_token';
const USER_KEY = 'happy_pods_user_info';

export interface StoredUser {
  id: number;
  name: string;
  email: string;
  role: string;
  address: string;
}

// 存储JWT token
export function storeToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

// 存储用户信息
export function storeUser(user: StoredUser): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

// 获取JWT token
export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

// 删除JWT token
export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}


// 获取用户信息
export function getUser(): StoredUser | null {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr) as StoredUser;
      } catch (error) {
        console.error('Failed to parse user info:', error);
        return null;
      }
    }
  }
  return null;
}

// 检查是否已登录
export function isLoggedIn(): boolean {
  return !!getToken();
}

// 获取带Authorization header的配置
export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
    };
  }
  return {};
}

// 登出
export function logout(): void {
  removeToken();
  // 可以在这里添加其他登出逻辑，比如清除其他缓存
}

// 自动从localStorage恢复登录状态
export function initializeAuth(): {
  isAuthenticated: boolean;
  user: StoredUser | null;
  token: string | null;
} {
  const token = getToken();
  const user = getUser();
  
  return {
    isAuthenticated: !!token,
    user,
    token,
  };
} 