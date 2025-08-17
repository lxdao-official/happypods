import { useEffect } from "react";
import useStore from "~/store";
import { api } from "~/trpc/react";
import { useUserInfo } from "~/hooks/useUserInfo";

const useNotifcation = () => {
    const { data: notifications,refetch:refetchNotification } = api.notification.getUserNotifications.useQuery();
    const {mutateAsync:readAllNotification} = api.notification.markAllNotificationsRead.useMutation();
    const {mutateAsync:readNotification} = api.notification.markNotificationRead.useMutation();

    const {setNotificationList} = useStore();
    const {userInfo} = useUserInfo();

    useEffect(() => {
        setNotificationList(notifications ?? []);
    }, [notifications]);

    const readAll = async()=>{
        await readAllNotification();
        refetchNotification();
    }

    const read = async(id:number)=>{
        await readNotification({id});
        refetchNotification();
    }

    useEffect(()=>{
        setNotificationList([]);
        refetchNotification();
    },[userInfo]);

    return {
        notifications:notifications||[],
        refetchNotification,
        readAll,
        read
    }
}

export default useNotifcation;  