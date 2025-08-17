"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Drawer,
  Button,
  Badge,
  Avatar,
  Chip,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
} from "@heroui/react";
import { formatDate } from "~/lib/utils";
import useNotifcation from "~/hooks/useNotifcation";
import Empty from "../empty";

export function NotificationDrawer() {
  const {notifications, readAll, read} = useNotifcation();
  const [isOpen,setIsOpen] = useState(false);

  const noReadNotification = useMemo(()=>{
    return notifications?.filter((notification) => !notification.read).length ?? 0;
  },[notifications]);

  return (
    <>
      {/* 通知图标按钮 */}
      <Badge
        color="primary"
        content={noReadNotification ?? 0}
        isInvisible={noReadNotification <= 0}
        className="cursor-pointer"
      >
        <i
          className="text-2xl cursor-pointer ri-mail-send-fill hover:text-primary"
          onClick={() => setIsOpen(!isOpen)}
        ></i>
      </Badge>

      {/* 通知抽屉 */}
      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="outline-none"
      >
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="flex flex-col gap-1">
                <div className="flex items-center w-full gap-4">
                  <h2 className="text-lg font-semibold">消息通知</h2>
                  {
                    noReadNotification > 0 && <span className="text-sm text-default-500">
                      {noReadNotification} 条未读
                    </span>
                  }
                </div>
              </DrawerHeader>
              <DrawerBody className="px-0">
                {notifications.length === 0 ? 
                <Empty/>
                : (
                  <div>
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`relative cursor-default border-b border-border py-4 transition-colors hover:opacity-80 ${
                          !notification.read ? "bg-[#ffffff18]" : ""
                        }`}
                        onClick={()=> !notification.read && read(notification.id)}
                      >
                        {/* 未读标识 */}
                        {!notification.read && (
                          <div className="absolute w-2 h-2 rounded-full left-2 top-5 bg-primary"></div>
                        )}

                        <div className="flex gap-3 pl-6">
                          {/* 内容区域 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="text-sm font-medium line-clamp-1 text-foreground">
                                {notification.title}
                              </div>
                            </div>

                            <p className="mb-2 text-xs line-clamp-2 text-default-600">
                              {notification.content}
                            </p>

                            <div className="flex items-center justify-between">
                              <span className="text-xs text-default-400">
                                {formatDate(
                                  notification.createdAt.toISOString(),
                                  "MM-DD HH:mm",
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </DrawerBody>
              {
                noReadNotification > 0 && <DrawerFooter>
                  <Button color="default" className="w-full" onPress={readAll}>全部已读</Button>
                </DrawerFooter>
              }
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}
