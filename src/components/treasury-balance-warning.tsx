"use client";

import { Alert } from "@heroui/react";
import Link from "next/link";
import AppBtn from "~/components/app-btn";
import { FEE_CONFIG } from "~/lib/config";
import Decimal from "decimal.js";
import { GrantsPoolTokens, MilestoneStatus, type GrantsPool, type Milestone, type Pod } from "@prisma/client";
import useSafeWallet from "~/hooks/useSafeWallet";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import useStore from "~/store";
import { formatToken } from "~/lib/utils";

interface TreasuryBalanceWarningProps {
  pod: Pod & { milestones: Milestone[],podTreasuryBalances: number, grantsPool: GrantsPool, currency: string };
}

export default function TreasuryBalanceWarning({pod}: TreasuryBalanceWarningProps) {
    const {getTransactionHash, isReady: safeWalletReady, getTransactionDetail, proposeOrExecuteTransaction} = useSafeWallet();
    const [shortageSafeHash, setShortageSafeHash] = useState<string>();//当前交易的 hash
    const [transfers, setTransfers] = useState<any[]>([]);

    const requiredAmount = pod.milestones.
    filter(milestone => [MilestoneStatus.ACTIVE,MilestoneStatus.REVIEWING].includes(milestone.status as any))
    .reduce((acc, milestone) => Decimal(acc).plus(milestone.amount).toNumber(), 0);

    // 如果国库余额交付+手续费不足，则显示提醒
    const shortage = Decimal(requiredAmount)
        .mul(FEE_CONFIG.TRANSACTION_FEE_RATE + 1)
        .minus(pod.podTreasuryBalances)
        .toNumber();

    // 获取当前交易 hash
    const getHash = async () => {
        if(!safeWalletReady || shortage===0) return;
        
        const transactions = await shortage>0 ? 
        // gp->pod
        getTransactionHash(pod.grantsPool.treasuryWallet, [
            {
                token: pod.currency as GrantsPoolTokens,
                from: pod.grantsPool.treasuryWallet,
                to: pod.walletAddress,
                amount: shortage.toString(),
            }
        ]) :
        // pod->gp
        getTransactionHash(pod.walletAddress, [
            {
                token: pod.currency as GrantsPoolTokens,
                from: pod.walletAddress,
                to: pod.grantsPool.treasuryWallet,
                amount: Math.abs(shortage).toString(),
            }
        ]);
        const {safeTxHash, transfers} = await transactions;
        console.log({safeTxHash, transfers});
        setShortageSafeHash(safeTxHash);
        setTransfers(transfers as any);
    }

    // 获取交易详情，判断当前用户是否需要签名
    const [needSign, setNeedSign] = useState<boolean>(false);
    const {userInfo} = useStore();
    const getTransactionInfo = async()=>{
        if(!shortageSafeHash || !userInfo) return;
        const res = await getTransactionDetail(shortageSafeHash);
        console.log('res===>',res);
        if(!res) return setNeedSign(true); // 没有找到交易，可以发起
        const isSigned = res?.confirmations?.some(v => v.owner.toLocaleLowerCase() === userInfo?.walletAddress?.toLocaleLowerCase());
        setNeedSign(!res?.isExecuted && !isSigned);// 交易未完成，并且当前用户未签名需要显示操作
    }
    useEffect(()=>{
        getTransactionInfo();
    },[shortageSafeHash, userInfo])
    
    // 交易构建并获取交易 hash
    useEffect(()=>{
        getHash();
    },[shortage,pod.grantsPool.treasuryWallet,pod.walletAddress,pod.currency,safeWalletReady])

    // 发起交易
    const [isSending, setIsSending] = useState<boolean>(false);
    const sendTx = async()=>{
        if(!shortageSafeHash || shortage===0 || !transfers.length) return;
        setIsSending(true);
        try {
            await proposeOrExecuteTransaction(
                shortage>0 ? pod.grantsPool.treasuryWallet : pod.walletAddress, 
                transfers as any
            );
            toast.success('Transaction initiated successfully');
       } catch (error) {
        toast.error('Transaction initiation failed');
       } finally {
        setIsSending(false);
       }
    }

    if (shortage === 0) return null;

    const safeWalletUrl = 'https://app.safe.global/transactions/tx?safe=oeth:' + (shortage>0 ? 
    `${pod.grantsPool.treasuryWallet}&id=multisig_${pod.grantsPool.treasuryWallet}_${shortageSafeHash}` : 
    `${pod.walletAddress}&id=multisig_${pod.walletAddress}_${shortageSafeHash}`);

    // todo 判断当前钱包是否在权限内
    
    const endContent = (
        <div className="flex gap-2">     
            {
                needSign && <AppBtn btnProps={{ color: "warning",onPress:sendTx, isLoading:isSending }}>Initiate Transaction</AppBtn>
            }

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
        </div>
    )
    return (
        shortage>0 ? 
            <Alert
            color="warning"
            variant="bordered"
            title="Pod Treasury Balance Insufficient!"
            className="mb-4"
            classNames={{ base: "bg-background" }}
            endContent={endContent}
            >
            <small className="mt-1 text-secondary">
                Please coordinate with the GP treasury multi-sig user to inject the missing funds <b className="text-warning">{formatToken(shortage)} {pod.currency}</b>, otherwise the Milestone cannot be delivered!
            </small>
            </Alert> :
            <Alert
            color="warning"
            variant="bordered"
            title="Pod Treasury Balance Exceeded!"
            className="mb-4"
            classNames={{ base: "bg-background" }}
            endContent={endContent}
        >
            <small className="mt-1 text-secondary">
            Pod treasury balance exceeded by <b className="text-warning">{formatToken(Math.abs(shortage))} {pod.currency}</b>. You can initiate a refund to the GP treasury!
            </small>
        </Alert>
    );
}
