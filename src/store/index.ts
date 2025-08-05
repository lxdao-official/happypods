import type { Notification } from '@prisma/client';
import { create } from 'zustand';
import {
  devtools,
  persist,
} from 'zustand/middleware';

interface State {
    notificationList: Notification[];
    setNotificationList: (list: Notification[]) => void;
}

const useStore = create<State>()(
    devtools(
        persist(
            (set) => ({
                notificationList:[],
                setNotificationList: (list: Notification[]) => set({ notificationList: list })
            }),
            {
                name: 'store-storage',
                partialize:(state)=>({})
            }
        )
    )
);


export default useStore;