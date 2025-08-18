"use client";

import { Alert } from "@heroui/react";
import Link from "next/link";
import AppBtn from "~/components/app-btn";
import { FEE_CONFIG } from "~/lib/config";
import Decimal from "decimal.js";
import { GrantsPoolTokens, MilestoneStatus, type GrantsPool, type Milestone, type Pod } from "@prisma/client";
import useSafeWallet from "~/hooks/useSafeWallet";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import useStore from "~/store";
import { formatToken } from "~/lib/utils";

interface TreasuryBalanceWarningProps {
  pod: Pod & { milestones: Milestone[],podTreasuryBalances: number, grantsPool: GrantsPool, currency: string };
}

export default function TreasuryBalanceWarning({pod}: TreasuryBalanceWarningProps) {
    const {getTransactionHash, isReady: safeWalletReady, getTransactionDetail, proposeOrExecuteTransaction, isReady, getWallet} = useSafeWallet();
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

    // 获取当前交易 hash
    const [needSign, setNeedSign] = useState<boolean>(false);
    const [walletIsSigner, setWalletIsSigner] = useState<boolean>(false);
    const getHashInfo = async () => {
        if(!transactionParams || !safeWalletReady) return;

        // 获取当前钱包信息
        const wallet = await getWallet(transactionParams.safeAddress);
        const isSigner = wallet?.owners?.some(v => v.toLocaleLowerCase() === userInfo?.walletAddress?.toLocaleLowerCase());
        setWalletIsSigner(isSigner);
        console.log(wallet,isSigner,userInfo?.walletAddress);
        if(!isSigner) return;

        // 交易 hash 生成获取
        const {safeTxHash, transfers} = await getTransactionHash(transactionParams.safeAddress, transactionParams.transfers);
        console.log({safeTxHash, transfers});
        const res = await getTransactionDetail(safeTxHash);
        console.log({safeTxHash, transfers, res});
        setShortageSafeHash(res ? safeTxHash : undefined);
        setTransfers(transfers as any);

        // 是否需要我签名
        const isSigned = res?.confirmations?.some(v => v.owner.toLocaleLowerCase() === userInfo?.walletAddress?.toLocaleLowerCase()) && !res?.isExecuted;
        setNeedSign(!isSigned);// 交易未完成，并且当前用户未签名需要显示操作
    }
    
    // 交易构建并获取交易 hash
    useEffect(()=>{
        getHashInfo();
    },[shortage,pod.grantsPool.treasuryWallet,pod.walletAddress,pod.currency,safeWalletReady,userInfo])

    // 发起交易
    const [isSending, setIsSending] = useState<boolean>(false);
    const sendTx = async()=>{
        if(shortage===0 || !transfers.length) return;
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

    if (shortage === 0 || !walletIsSigner) return null;

    const safeWalletUrl = 'https://app.safe.global/transactions/tx?safe=oeth:' + (shortage>0 ? 
    `${pod.grantsPool.treasuryWallet}&id=multisig_${pod.grantsPool.treasuryWallet}_${shortageSafeHash}` : 
    `${pod.walletAddress}&id=multisig_${pod.walletAddress}_${shortageSafeHash}`);

    // todo 判断当前钱包是否在权限内
    
    const endContent = (
        <div className="flex gap-2">     
            {
                needSign && 
                <AppBtn btnProps={{ color: shortage>0 ? "warning" : "success", onPress:sendTx, isLoading:isSending }}>Initiate Transaction</AppBtn>
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
                    <small className="mt-1 text-secondary">
                        Please coordinate with the GP treasury multi-sig user to inject the missing funds <b className="text-warning">{formatToken(shortage)} {pod.currency}</b>, otherwise the Milestone cannot be delivered!
                    </small>
                    </Alert> :
                    <Alert
                    color="success"
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
            }
        </div>
    );
}
