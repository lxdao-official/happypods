"use client";

import { usePathname } from "next/navigation";
import RequireLogin from "~/components/require-login";

interface AuthProviderProps {
  children: React.ReactNode;
}

// 需要登录才能访问的路由列表
const PROTECTED_ROUTES = [
  "/pods/create",           // Pod 创建页面
  "/pods/edit/",           // Pod 编辑页面 (动态路由)
  "/grants-pool/create",   // GP 创建页面
  "/grants-pool/[id]/edit", // GP 编辑页面 (动态路由)
  "/my-pods",              // 我的 Pod
  "/my-grants-pool",       // 我的 GP
  "/profile",              // 个人资料
];

export function AuthProvider({ children }: AuthProviderProps) {
  const pathname = usePathname();
  
  // 检查当前路径是否需要保护
  const isProtectedRoute = PROTECTED_ROUTES.some(route => {
    // 处理动态路由
    if (route.includes("[id]")) {
      const routePattern = route.replace("[id]", "\\d+");
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(pathname);
    }
    
    // 处理动态路由后缀 (如 /pods/edit/123)
    if (route.endsWith("/")) {
      return pathname.startsWith(route);
    }
    
    // 精确匹配
    return pathname === route;
  });

  // 如果是受保护的路由，使用 RequireLogin 包裹
  if (isProtectedRoute) {
    return (
      <RequireLogin showPlaceholder>
        {children}
      </RequireLogin>
    );
  }

  // 其他路由直接返回
  return <>{children}</>;
}
