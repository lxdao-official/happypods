import type { Notification, User } from '@prisma/client';
import { create } from 'zustand';
import {
  devtools,
  persist,
} from 'zustand/middleware';
import type { MetaTransactionData } from "@safe-global/types-kit";

// SafeWallet 交易步骤枚举
export enum SafeTransactionStep {
  PROPOSAL = 'proposal',           // 创建提案步骤
  CONFIRMATION = 'confirmation',   // 多签确认步骤
  WAITEXECUTION = 'waitExecution',   // 多签完成，等待执行
  EXECUTION = 'execution',         // 执行交易步骤
  COMPLETED = 'completed'          // 完成步骤
}

// 步骤状态枚举
export enum SafeStepStatus {
  PENDING = 'pending',     // 等待中
  PROCESSING = 'processing', // 处理中
  SUCCESS = 'success',     // 成功
  ERROR = 'error'         // 错误
}

// SafeWallet 交易处理对象
export interface SafeTransactionHandler {
  // 交易基本信息
  safeAddress: string;
  title?: string; // 交易标题
  description?: React.ReactNode; // 支持组件类型，更灵活的内容展示
  
  // 交易参数（必填，用于生成 hash 和创建提案）
  transfers: MetaTransactionData[];
  
  // 回调函数
  onStepChange?: (
    step: SafeTransactionStep, 
    status: SafeStepStatus, 
    data?: any, 
    error?: Error
  ) => void;

  onClose?: () => void;
  uuid?:string; // 用于区分交易，可能存在同一个交易再次触发
}

interface State {
  // 用户信息
  userInfo: User | null;
  setUserInfo: (user: User | null) => void;
  
  // 通知信息
  notificationList: Notification[];
  setNotificationList: (list: Notification[]) => void;
  
  // SafeWallet 交易处理
  safeTransactionHandler: SafeTransactionHandler | null;
  setSafeTransactionHandler: (handler: SafeTransactionHandler | null) => void;
  clearSafeTransactionHandler: () => void;

  // pod 详情刷新
  podDetailRefreshKey: number;
  setPodDetailRefreshKey: () => void;
}

const useStore = create<State>()(
  devtools(
    persist(
      (set) => ({
        userInfo: null,
        setUserInfo: (user: User | null) => set({ userInfo: user }),
        notificationList: [],
        setNotificationList: (list: Notification[]) => set({ notificationList: list }),
        
        // SafeWallet 相关
        safeTransactionHandler: null,
        setSafeTransactionHandler: (handler: SafeTransactionHandler | null) => set({ safeTransactionHandler: handler ? {...handler,uuid: `safe-tx-${Date.now()}`} : null }),
        clearSafeTransactionHandler: () => set({ safeTransactionHandler: null }),

        // pod 详情刷新
        podDetailRefreshKey: 0,
        setPodDetailRefreshKey: () => set((state) => ({ podDetailRefreshKey: state.podDetailRefreshKey + 1 })),
      }),
      {
        name: 'store-storage',
        partialize: (state) => ({
          userInfo: state.userInfo
        })
      }
    )
  )
);

export default useStore;