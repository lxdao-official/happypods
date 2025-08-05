import { useEffect } from "react";
import useStore from "~/store";
import { api } from "~/trpc/react";

const useNotifcation = () => {
    const { data: notifications,refetch:refetchNotification } = api.notification.getUserNotifications.useQuery();
    const {mutateAsync:readAllNotification} = api.notification.markAllNotificationsRead.useMutation();
    const {mutateAsync:readNotification} = api.notification.markNotificationRead.useMutation();

    const {setNotificationList} = useStore();
    
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

    return {
        notifications:notifications||[],
        refetchNotification,
        readAll,
        read
    }
}

export default useNotifcation;  