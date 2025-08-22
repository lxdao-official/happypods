"use client";

import { Alert } from "@heroui/react";
import Link from "next/link";
import AppBtn from "~/components/app-btn";
import { FEE_CONFIG } from "~/lib/config";
import Decimal from "decimal.js";
import { type GrantsPoolTokens, MilestoneStatus, type GrantsPool, type Milestone, type Pod } from "@prisma/client";
import useSafeWallet from "~/hooks/useSafeWallet";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import useStore from "~/store";
import { delay_s, formatToken } from "~/lib/utils";
import { PLATFORM_MOD_ADDRESS } from "~/lib/config";

interface TreasuryBalanceWarningProps {
  pod: Pod & { milestones: Milestone[],podTreasuryBalances: number, grantsPool: GrantsPool, currency: string };
}

export default function TreasuryBalanceWarning({pod}: TreasuryBalanceWarningProps) {
    const {getTransactionHash, isReady: safeWalletReady, getTransactionDetail, proposeOrExecuteTransaction, isReady, getWallet, confirmTransactionViaNestedMultisig} = useSafeWallet();
    const [shortageSafeHash, setShortageSafeHash] = useState<string>();//当前交易的 hash
    const [transfers, setTransfers] = useState<any[]>([]);
    const {userInfo} = useStore();
    

    const requiredAmount = pod.milestones.
    filter(milestone => [MilestoneStatus.ACTIVE,MilestoneStatus.REVIEWING].includes(milestone.status as any))
    .reduce((acc, milestone) => Decimal(acc).plus(milestone.amount).toNumber(), 0);

    // 如果国库余额交付+手续费不足，则显示提醒
    const shortage = Decimal(requiredAmount)
        .mul(FEE_CONFIG.TRANSACTION_FEE_RATE + 1)
        .minus(pod.podTreasuryBalances)
        .toNumber();
    
    // 构建当前交易与钱包
    const transactionParams = useMemo(()=>{
        if(!safeWalletReady || shortage===0) return null;
        return shortage>0 ?  
        {
            safeAddress: pod.grantsPool.treasuryWallet,
            transfers: [{
                token: pod.currency as GrantsPoolTokens,
                from: pod.grantsPool.treasuryWallet,
                to: pod.walletAddress,
                amount: shortage.toString(),
            }]
        } : {
            safeAddress: pod.walletAddress,
            transfers: [{
                token: pod.currency as GrantsPoolTokens,
                from: pod.walletAddress,
                to: pod.grantsPool.treasuryWallet,
                amount: Math.abs(shortage).toString(),
            }]
        }
    },[shortage,pod.grantsPool.treasuryWallet,pod.walletAddress,pod.currency,safeWalletReady])

    // 权限和操作状态
    const [userRole, setUserRole] = useState<'gpOwner' | 'podOwner' | 'platformMod' | 'none'>('none');
    const [showAction, setShowAction] = useState<boolean>(false);
    const [actionType, setActionType] = useState<'propose' | 'confirm'>('propose');
    const [showWaitingMessage, setShowWaitingMessage] = useState<boolean>(false);
    
    const getHashInfo = async () => {
        if(!transactionParams || !safeWalletReady || !userInfo?.walletAddress) return;

        const userAddress = userInfo.walletAddress.toLowerCase();
        
        // 检查用户是否为系统管理员
        const isPlatformMod = userAddress === PLATFORM_MOD_ADDRESS.toLowerCase();
        
        // 获取相关钱包信息
        const targetWallet = await getWallet(transactionParams.safeAddress);
        const gpWallet = shortage > 0 ? targetWallet : await getWallet(pod.grantsPool.treasuryWallet);
        const podWallet = shortage < 0 ? targetWallet : await getWallet(pod.walletAddress);

        // 检查用户角色
        const isGPOwner = gpWallet?.owners?.some(v => v.toLowerCase() === userAddress);
        const isPodOwner = podWallet?.owners?.some(v => v.toLowerCase() === userAddress) && !isGPOwner; // Pod Owner但不是GP Owner
        
        console.log('用户角色检查:', { userAddress, isGPOwner, isPodOwner, isPlatformMod, shortage });

        // 设置用户角色
        if (isPlatformMod) {
            setUserRole('platformMod');
        } else if (isGPOwner) {
            setUserRole('gpOwner');
        } else if (isPodOwner) {
            setUserRole('podOwner');
        } else {
            setUserRole('none');
            setShowAction(false);
            setShowWaitingMessage(false);
            return;
        }

        // 交易 hash 生成获取
        const {safeTxHash, transfers} = await getTransactionHash(transactionParams.safeAddress, transactionParams.transfers);
        console.log({safeTxHash, transfers});
        if(!safeTxHash) return;
        
        const transactionInfo = await getTransactionDetail(safeTxHash);
        console.log({safeTxHash, transfers, transactionInfo});
        setShortageSafeHash(transactionInfo ? safeTxHash : undefined);
        setTransfers(transfers);

        // 根据场景和用户角色决定显示什么操作
        if (shortage > 0) {
            // 场景1: GP向Pod注资，只有GP Owner可以操作
            if (isGPOwner) {
                // 检查当前用户是否已经签名
                const hasUserSigned = transactionInfo?.confirmations?.some(v => 
                    v.owner.toLowerCase() === userAddress
                );
                
                // 只有在交易未执行且用户未签名时才显示按钮
                setShowAction(!transactionInfo?.isExecuted && !hasUserSigned);
                setActionType('propose');
                setShowWaitingMessage(false);
            } else {
                setShowAction(false);
                setShowWaitingMessage(false);
            }
        } else {
            // 场景2: Pod向GP退款
            if (isPodOwner || isPlatformMod) {
                // Pod Owner或系统管理员可以发起退款
                // 检查当前用户是否已经签名
                const hasUserSigned = transactionInfo?.confirmations?.some(v => 
                    v.owner.toLowerCase() === userAddress
                );
                
                // 只有在交易未执行且用户未签名时才显示按钮
                setShowAction(!transactionInfo?.isExecuted && !hasUserSigned);
                setActionType('propose');
                setShowWaitingMessage(false);
            } else if (isGPOwner) {
                if (transactionInfo) {
                    // GP Owner只能确认已存在的交易
                    const hasNestedConfirmed = transactionInfo.confirmations?.some(
                        confirmation => confirmation.owner.toLowerCase() === pod.grantsPool.treasuryWallet.toLowerCase()
                    );
                    setShowAction(!hasNestedConfirmed && !transactionInfo.isExecuted);
                    setActionType('confirm');
                    setShowWaitingMessage(false);
                } else {
                    // 交易不存在，显示等待提示
                    setShowAction(false);
                    setActionType('confirm');
                    setShowWaitingMessage(true);
                }
            } else {
                setShowAction(false);
                setShowWaitingMessage(false);
            }
        }
    }
    
    // 交易构建并获取交易 hash
    useEffect(()=>{
        getHashInfo();
    },[shortage,pod.grantsPool.treasuryWallet,pod.walletAddress,pod.currency,safeWalletReady,userInfo])

    // 发起交易或确认交易
    const [isSending, setIsSending] = useState<boolean>(false);
    const handleAction = async()=>{
        if(shortage===0 || !transfers.length) return;
        
        // 对于确认操作，需要有交易hash
        if(actionType === 'confirm' && !shortageSafeHash) {
            toast.error('No transaction found to confirm');
            return;
        }
        setIsSending(true);
        
        try {
            if (actionType === 'propose') {
                // 发起提案或签名确认
                await proposeOrExecuteTransaction(
                    shortage>0 ? pod.grantsPool.treasuryWallet : pod.walletAddress, 
                    transfers as any
                );
                toast.success(shortage > 0 ? 'GP funding transaction initiated successfully' : 'Refund transaction initiated successfully');
            } else if (actionType === 'confirm' && shortageSafeHash) {
                // GP多签钱包确认Pod的退款交易
                await confirmTransactionViaNestedMultisig(
                    pod.walletAddress, // Pod钱包地址
                    shortageSafeHash, // Pod的退款交易hash
                    pod.grantsPool.treasuryWallet // GP多签钱包地址
                );
                toast.success('Refund transaction confirmed successfully');
            }
            
            await delay_s(1000, true);
            // 重新获取状态
            await getHashInfo();
       } catch (error) {
        console.error(error);
       } finally {
        setIsSending(false);
       }
    }

    if (shortage === 0) return null;

    const safeWalletUrl = 'https://app.safe.global/transactions/tx?safe=oeth:' + (shortage>0 ? 
    `${pod.grantsPool.treasuryWallet}&id=multisig_${pod.grantsPool.treasuryWallet}_${shortageSafeHash}` : 
    `${pod.walletAddress}&id=multisig_${pod.walletAddress}_${shortageSafeHash}`);


    // 获取按钮文本和颜色
    const getButtonProps = () => {
        if (shortage > 0) {
            return {
                text: userRole === 'gpOwner' ? 'Fund Pod Treasury' : 'Initiate Transaction',
                color: 'warning' as const
            };
        } else {
            if (actionType === 'propose') {
                return {
                    text: userRole === 'platformMod' ? 'Initiate Refund (Admin)' : 'Initiate Refund',
                    color: 'success' as const
                };
            } else {
                return {
                    text: 'Confirm Refund (GP)',
                    color: 'primary' as const
                };
            }
        }
    };

    const buttonProps = getButtonProps();

    const endContent = (
        <div className="flex items-center gap-2">     
            {
                showAction && 
                <AppBtn btnProps={{ 
                    color: buttonProps.color, 
                    onPress: handleAction, 
                    isLoading: isSending 
                }}>
                    {buttonProps.text}
                </AppBtn>
            }
            {
                shortageSafeHash &&
                <Link
                href={safeWalletUrl}
                target="_blank"
                >
                <AppBtn btnProps={{ color: "default" }}>
                    <div className="flex gap-2">
                    <span>Safe wallet</span>
                    <i className="ri-external-link-line"></i>
                    </div>
                </AppBtn>
                </Link>
            }
           
        </div>
    )
    return (
        <div className="fadeIn">
            {
                shortage>0 ? 
                    <Alert
                    color="warning"
                    variant="bordered"
                    title="Pod Treasury Balance Insufficient!"
                    className="mb-4"
                    classNames={{ base: "bg-background" }}
                    endContent={endContent}
                    >
                    <div>
                        <div className="mt-1 text-sm text-secondary">
                            Please coordinate with the GP treasury multi-sig user to inject the missing funds <b className="text-warning">{formatToken(shortage)} {pod.currency}</b>, otherwise the Milestone cannot be delivered!
                        </div>
                        {
                            showWaitingMessage && 
                            <div className="mt-1 text-sm italic text-red-500">
                                Waiting for Pod Owner to initiate refund...
                            </div>
                        }
                    </div>
                    </Alert> :
                    <Alert
                    color="warning"
                    variant="bordered"
                    title="Pod Treasury Balance Exceeded!"
                    className="mb-4"
                    classNames={{ base: "bg-background" }}
                    endContent={endContent}
                >
                    <div className="mt-1 text-sm text-secondary">
                        Pod treasury balance exceeded by <b className="text-warning">{formatToken(Math.abs(shortage))} {pod.currency}</b>. You can initiate a refund to the GP treasury!
                    </div>
                </Alert>
            }
        </div>
    );
}
