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
import EmptyReplace from "~/components/empty-replace";
import { useMobile } from "~/hooks/useMobile";

export function NotificationDrawer() {
  const {notifications, readAll, read} = useNotifcation();
  const [isOpen,setIsOpen] = useState(false);

  const noReadNotification = useMemo(()=>{
    return notifications?.filter((notification) => !notification.read).length ?? 0;
  },[notifications]);

  const isMobile = useMobile();

  return (
    <>
      {/* 通知图标按钮 */}
      <Badge
        color="danger"
        content={noReadNotification ?? 0}
        isInvisible={noReadNotification <= 0}
        className="cursor-pointer"
      >
        <Button variant="faded" size={isMobile ? "sm" : "md"} className="min-w-0" onPress={() => setIsOpen(!isOpen)}>
          <i className="text-xl cursor-pointer md:text-2xl ri-mail-send-fill group-hover:text-primary"></i>
        </Button>
      </Badge>

      {/* 通知抽屉 */}
      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        placement="right"
        size={isMobile ? "xs" : "md"}
        isDismissable={true}
      >
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="flex flex-col gap-1">
                <div className="flex items-center w-full gap-4">
                  <h2 className="text-lg font-semibold">Notifications</h2>
                  {
                    noReadNotification > 0 && <span className="text-sm text-default-500">
                      （{noReadNotification} unread）
                    </span>
                  }
                </div>
              </DrawerHeader>
              <DrawerBody className="px-0">
                {notifications.length === 0 ? 
                <EmptyReplace/>
                : (
                  <div>
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`relative cursor-default border-b border-gray-200 py-4 transition-colors hover:opacity-80 ${
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
                              <div className="text-sm font-medium break-all text-foreground">
                                {notification.title}
                              </div>
                            </div>

                            <div className="pr-2 mb-2 text-xs leading-5 break-all text-secondary">
                              {notification.content}
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-xs text-default-400">
                                {formatDate(notification.createdAt)}
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
                  <Button color="default" className="w-full" onPress={readAll}>Read All</Button>
                </DrawerFooter>
              }
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}
