"use client";

import { Alert } from "@heroui/react";
import Link from "next/link";
import AppBtn from "~/components/app-btn";
import { FEE_CONFIG } from "~/lib/config";
import Decimal from "decimal.js";
import { GrantsPoolTokens, MilestoneStatus, type GrantsPool, type Milestone, type Pod } from "@prisma/client";
import useSafeWallet from "~/app/hooks/useSafeWallet";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import useStore from "~/store";

interface TreasuryBalanceWarningProps {
  pod: Pod & { milestones: Milestone[],podTreasuryBalances: number, grantsPool: GrantsPool };
}

export default function TreasuryBalanceWarning({pod}: TreasuryBalanceWarningProps) {
    const {status, getHashFromSafeTransaction, isReady: safeWalletReady, getTransactionDetail} = useSafeWallet();
    const [shortageSafeHash, setShortageSafeHash] = useState<string>();

    const requiredAmount = pod.milestones.
    filter(milestone => [MilestoneStatus.ACTIVE].includes(milestone.status as any))
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
        getHashFromSafeTransaction(pod.grantsPool.treasuryWallet, [
            {
                token: pod.currency as GrantsPoolTokens,
                from: pod.grantsPool.treasuryWallet,
                to: pod.walletAddress,
                amount: shortage.toString(),
            }
        ]) :
        // pod->gp
        getHashFromSafeTransaction(pod.walletAddress, [
            {
                token: pod.currency as GrantsPoolTokens,
                from: pod.walletAddress,
                to: pod.grantsPool.treasuryWallet,
                amount: Math.abs(shortage).toString(),
            }
        ]);
        const hash = await transactions;
        setShortageSafeHash(hash);
    }

    // 获取交易详情，判断当前用户是否需要签名
    const [needSign, setNeedSign] = useState<boolean>(false);
    const {userInfo} = useStore();
    const getTransactionInfo = async()=>{
        if(!shortageSafeHash || !userInfo) return;
        const res = await getTransactionDetail(shortageSafeHash);
        const isSigned = res.confirmations?.some(v => v.owner.toLocaleLowerCase() === userInfo?.walletAddress?.toLocaleLowerCase());
        setNeedSign(!res.isExecuted && !isSigned);// 交易未完成，并且当前用户未签名需要显示操作
    }
    useEffect(()=>{
        getTransactionInfo();
    },[shortageSafeHash, userInfo])
    
    // 交易构建并获取交易 hash
    useEffect(()=>{
        getHash();
    },[shortage,pod.grantsPool.treasuryWallet,pod.walletAddress,pod.currency,safeWalletReady])

    // 发起交易
    const sendTx = async()=>{

    }

    if (shortage === 0) return null;
    const endContent = (
        <div className="flex gap-2">     
            {
                needSign && <AppBtn btnProps={{ color: "warning",onPress:sendTx, isLoading:status === 'loading' }}>发起交易</AppBtn>
            }

            <Link
            href={`https://app.safe.global/transactions/tx?safe=oeth:${pod.grantsPool.treasuryWallet}&id=multisig_${pod.grantsPool.treasuryWallet}_${shortageSafeHash}`}
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
            title="国库余额不足！"
            className="mb-4"
            classNames={{ base: "bg-background" }}
            endContent={endContent}
            >
            <small className="mt-1 text-secondary">
                请协调 GP 国库多签用户完成 Pod 注入缺额资金 <b className="text-warning">{shortage} {pod.currency}</b>，否则 Milestone 将无法交付！
            </small>
            </Alert> :
            <Alert
            color="warning"
            variant="bordered"
            title="国库余额超额！"
            className="mb-4"
            classNames={{ base: "bg-background" }}
            endContent={endContent}
        >
            <small className="mt-1 text-secondary">
            国库余额超额 <b className="text-warning">{Math.abs(shortage)} {pod.currency}</b>，您可以发起退换 GP 国库操作！
            </small>
        </Alert>
    );
}
