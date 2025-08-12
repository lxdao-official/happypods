import type { Notification, User } from '@prisma/client';
import { create } from 'zustand';
import {
  devtools,
  persist,
} from 'zustand/middleware';

interface State {
    // 用户信息
    userInfo: User | null;
    setUserInfo: (user: User | null) => void;
    
    // 通知信息
    notificationList: Notification[];
    setNotificationList: (list: Notification[]) => void;
}

const useStore = create<State>()(
    devtools(
        persist(
            (set) => ({
                userInfo: null,
                setUserInfo: (user: User | null) => set({ userInfo: user }),
                notificationList:[],
                setNotificationList: (list: Notification[]) => set({ notificationList: list })
            }),
            {
                name: 'store-storage',
                partialize:(state)=>({
                    userInfo: state.userInfo
                })
            }
        )
    )
);


export default useStore;