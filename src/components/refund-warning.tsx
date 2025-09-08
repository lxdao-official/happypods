"use client";

import { Alert } from "@heroui/react";
import AppBtn from "~/components/app-btn";
import { type GrantsPoolTokens, type GrantsPool, type Milestone, type Pod } from "@prisma/client";
import useSafeWallet from "~/hooks/useSafeWallet";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import useStore, { SafeTransactionStep, SafeStepStatus } from "~/store";
import { delay_s, formatToken } from "~/lib/utils";
import { buildMetaTransactionData, buildNestedMultisigApprovalTransaction, getSafeWalletOwners, buildErc20SafeTransactionAndHash } from "~/lib/safeUtils";

interface RefundWarningProps {
  pod: Pod & {
    milestones: Milestone[];
    podTreasuryBalances: number;
    grantsPool: GrantsPool;
    currency: string
  };
  shortage: number;
}

export default function RefundWarning({ pod, shortage }: RefundWarningProps) {
  const { isReady: safeWalletReady, getTransactionDetail } = useSafeWallet();
  const { userInfo, setSafeTransactionHandler, clearSafeTransactionHandler, setPodDetailRefreshKey } = useStore();

  // 权限状态
  const [isGPOwner, setIsGPOwner] = useState(false);
  const [isPodOwner, setIsPodOwner] = useState(false);
  const [isGPMultisigOwner, setIsGPMultisigOwner] = useState(false);
  const [isPodMultisigOwner, setIsPodMultisigOwner] = useState(false);
  const [refundTransactionHash, setRefundTransactionHash] = useState<string | null>(null);
  const [mainTransactionExists, setMainTransactionExists] = useState<boolean>(false);
  const [mainTransactionReady, setMainTransactionReady] = useState<boolean>(false); // 主交易是否已达到执行阈值
  const [checkingTransaction, setCheckingTransaction] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // 检查用户权限和多签状态 - 优化：只在必要时执行
  useEffect(() => {
    if (!userInfo?.walletAddress) return;

    // 检查是否为 GP Owner
    const checkIsGPOwner = userInfo.id === pod.grantsPool.ownerId;
    setIsGPOwner(checkIsGPOwner);

    // 检查是否为 Pod Owner
    const checkIsPodOwner = userInfo.id === pod.applicantId;
    setIsPodOwner(checkIsPodOwner);

    // 检查多签钱包权限 - 避免重复请求
    let isMounted = true;
    const checkMultisigOwners = async () => {
      try {
        // 并行检查GP和Pod多签权限，减少请求次数
        const [gpOwners, podOwners] = await Promise.all([
          getSafeWalletOwners(pod.grantsPool.treasuryWallet),
          getSafeWalletOwners(pod.walletAddress)
        ]);

        if (!isMounted) return; // 组件已卸载，不更新状态

        const isGPMultisig = gpOwners.some((owner: string) =>
          owner.toLowerCase() === userInfo.walletAddress.toLowerCase()
        );
        setIsGPMultisigOwner(isGPMultisig);

        const isPodMultisig = podOwners.some((owner: string) =>
          owner.toLowerCase() === userInfo.walletAddress.toLowerCase()
        );
        setIsPodMultisigOwner(isPodMultisig);

      } catch (error) {
        console.error('检查多签权限失败:', error);
      }
    };

    checkMultisigOwners();

    // 清理函数
    return () => {
      isMounted = false;
    };
  }, [userInfo?.walletAddress, userInfo?.id, pod.grantsPool.ownerId, pod.grantsPool.treasuryWallet, pod.applicantId, pod.walletAddress]);

  // 构建退款交易参数，并获取交易 hash - 优化：避免重复计算
  useEffect(() => {
    if (!safeWalletReady) return;

    let isMounted = true;
    const buildRefundTransaction = async () => {
      try {
        const transfers = [{
          token: pod.currency as GrantsPoolTokens,
          to: pod.grantsPool.treasuryWallet,
          amount: shortage.toString()
        }];

        const { hash } = await buildErc20SafeTransactionAndHash(pod.walletAddress, transfers);

        if (!isMounted) return; // 组件已卸载，不更新状态
        setRefundTransactionHash(hash);

        // 检查交易是否已经提案
        await checkMainTransactionStatus(hash);
      } catch (error) {
        console.error('构建退款交易失败:', error);
      }
    };

    buildRefundTransaction();

    return () => {
      isMounted = false;
    };
  }, [safeWalletReady, pod.currency, pod.grantsPool.treasuryWallet, pod.walletAddress, shortage]);

  // 检查主交易是否已经提案
  const checkMainTransactionStatus = async (transactionHash: string) => {
    if (!transactionHash) return;

    setCheckingTransaction(true);
    try {
      const transactionDetail = await getTransactionDetail(transactionHash);
      const exists = !!transactionDetail;
      setMainTransactionExists(exists);

      // 检查交易是否已达到执行阈值
      if (exists && transactionDetail) {
        const isReady = transactionDetail.confirmations &&
          transactionDetail.confirmations.length >= transactionDetail.confirmationsRequired &&
          !transactionDetail.isExecuted;
        setMainTransactionReady(!!isReady);
      } else {
        setMainTransactionReady(false);
      }
    } catch (error) {
      console.error('检查交易状态失败:', error);
      setMainTransactionExists(false);
      setMainTransactionReady(false);
    } finally {
      setCheckingTransaction(false);
    }
  };

  // 权限检查：确定是否显示按钮
  const canInitiateRefund = useMemo(() => {
    if (!userInfo?.walletAddress || !refundTransactionHash) return false;

    // GP Owner 或者 GP 多签 Owner：只有在主交易已提案时才显示按钮
    if (isGPOwner || isGPMultisigOwner) {
      return mainTransactionExists && !checkingTransaction;
    }

    // Pod 多签 Owner 可以直接发起 Pod 退款交易
    if (isPodMultisigOwner) return true;

    return false;
  }, [userInfo, isGPOwner, isGPMultisigOwner, isPodMultisigOwner, mainTransactionExists, checkingTransaction, refundTransactionHash]);

  // 发起退款交易
  const handleRefund = async () => {
    if (!refundTransactionHash || isProcessing) return;

    setIsProcessing(true);
    try {
      // 刷新交易状态
      // await checkMainTransactionStatus(refundTransactionHash);

      // 如果是 GP 用户，需要先检查主交易是否已经提案
      if (isGPOwner || isGPMultisigOwner) {
        if (!mainTransactionExists) {
          toast.error('Please wait for Pod Owner to initiate refund proposal first!');
          return;
        }

        // 检查主交易是否已达到执行阈值
        const transactionInfo = await getTransactionDetail(refundTransactionHash);
        if (
          transactionInfo &&
          transactionInfo.confirmations &&
          transactionInfo.confirmations.length >= transactionInfo.confirmationsRequired &&
          !transactionInfo.isExecuted
        ) {
          // 主交易已达到阈值，直接执行第二步
          await triggerPodRefundExecution();
          return;
        }

        // 主交易未达到阈值，执行第一步GP确认
        await triggerGPApprovalFlow();
        return;
      }

      // 如果是 Pod 多签 Owner，检查交易阈值
      if (isPodMultisigOwner) {
        await triggerPodRefundExecution();
        return;
      }
    } catch (error) {
      console.error('退款操作失败:', error);
      toast.error('Refund operation failed, please retry');
    } finally {
      setIsProcessing(false);
    }
  };

  // 第一步：GP 钱包确认 Pod 钱包的退款交易
  const triggerGPApprovalFlow = async () => {
    if (!refundTransactionHash) {
      toast.error('Refund transaction hash not found');
      return;
    }

    try {
      // 构建第一步：GP钱包确认Pod钱包交易的approveHash交易
      const approvalTransfers = buildNestedMultisigApprovalTransaction(
        pod.walletAddress,                    // Pod 钱包地址
        refundTransactionHash,               // Pod 钱包的退款交易 hash
        pod.grantsPool.treasuryWallet        // GP 钱包地址
      );

      // 构建交易描述
      const getApprovalDescription = () => (
        <div className="space-y-3">
          <div className="p-3 border rounded-lg bg-success/5 border-success/10">
            <div className="space-y-1 text-small">
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-mono text-primary">{formatToken(shortage)} {pod.currency}</span>
              </div>
              <div className="flex justify-between">
                <span>From:</span>
                <span className="font-mono text-tiny">{pod.walletAddress.slice(0, 6)}...{pod.walletAddress.slice(-4)}</span>
              </div>
              <div className="flex justify-between">
                <span>To:</span>
                <span className="font-mono text-tiny">{pod.grantsPool.treasuryWallet.slice(0, 6)}...{pod.grantsPool.treasuryWallet.slice(-4)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-tiny text-primary">
            <i className="ri-shield-check-line"></i>
            <span>GP multi-sig approves Pod refund transaction</span>
          </div>
        </div>
      );

      // 触发第一步：GP钱包的确认交易
      setSafeTransactionHandler({
        safeAddress: pod.grantsPool.treasuryWallet,
        transfers: approvalTransfers,
        title: 'Refund Approval - GP Confirmation',
        description: getApprovalDescription(),

        onClose: () => {
          setIsProcessing(false);
        },

        onStepChange: async (step, status, data, error) => {
          console.log('GP approval step change:', { step, status, data, error });

          // 当 GP 钱包的确认交易执行完成后，触发第二步
          if (step === SafeTransactionStep.EXECUTION && status === SafeStepStatus.SUCCESS) {
            try {
              toast.info('GP approval completed, next executing refund...');
              await delay_s(2000);
              await triggerPodRefundExecution();
            } catch (error) {
              console.error('Failed to trigger refund execution:', error);
              toast.error('Refund execution failed, please retry');
              setIsProcessing(false);
            }
          }

        }
      });

    } catch (error) {
      console.error("GP approval failed:", error);
      toast.error("GP approval failed, please retry!");
      setIsProcessing(false);
    }
  };

  // 第二步：执行Pod钱包的退款交易
  const triggerPodRefundExecution = async () => {
    try {
      const transfers = [buildMetaTransactionData(
        pod.currency as GrantsPoolTokens,
        pod.grantsPool.treasuryWallet,
        shortage.toString()
      )];

      // 构建退款交易描述
      const getRefundDescription = () => (
        <div className="space-y-3">
          <div className="p-3 border rounded-lg bg-success/5 border-success/10">
            <h4 className="mb-2 font-medium text-success">Refund Execution</h4>
            <div className="space-y-1 text-small">
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-mono text-success">{formatToken(shortage)} {pod.currency}</span>
              </div>
              <div className="flex justify-between">
                <span>From:</span>
                <span className="font-mono text-tiny">{pod.walletAddress.slice(0, 6)}...{pod.walletAddress.slice(-4)}</span>
              </div>
              <div className="flex justify-between">
                <span>To:</span>
                <span className="font-mono text-tiny">{pod.grantsPool.treasuryWallet.slice(0, 6)}...{pod.grantsPool.treasuryWallet.slice(-4)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-tiny text-primary">
            <i className="ri-money-dollar-circle-line"></i>
            <span>Executes refund transaction</span>
          </div>
        </div>
      );

      setSafeTransactionHandler({
        safeAddress: pod.walletAddress,
        transfers: transfers,
        title: 'Refund Execution',
        description: getRefundDescription(),

        onClose: () => {
          setIsProcessing(false);
        },

        onStepChange: async (step, status, data, error) => {
          console.log('Refund execution step change:', { step, status, data, error });

          // 当退款交易执行完成后
          if (step === SafeTransactionStep.EXECUTION && status === SafeStepStatus.SUCCESS) {
            clearSafeTransactionHandler();
            setIsProcessing(false);

            // 等待一段时间后刷新页面
            await delay_s(3000);
            setPodDetailRefreshKey();
          }
        }
      });

    } catch (error) {
      console.error('退款执行失败:', error);
      setIsProcessing(false);
      throw new Error("Refund data unavailable");
    }
  };

  // 根据用户权限和交易状态显示不同的按钮文本
  const getButtonText = () => {
    if (isGPOwner || isGPMultisigOwner) {
      if (mainTransactionReady) {
        return 'Execute Refund'; // 主交易已达到阈值，直接执行
      }
      if (mainTransactionExists) {
        return 'Approve Refund'; // 主交易存在但未达到阈值，需要GP确认
      }
      return 'Approve Refund'; // 默认确认文本
    }
    if (isPodMultisigOwner) {
      return 'Execute Refund'; // Pod 多签用户执行退款
    }
    return 'Initiate Refund';
  };

  const endContent = (
    <div className="flex items-center gap-2">
      {canInitiateRefund && (
        <AppBtn
          btnProps={{
            color: 'success',
            onPress: handleRefund,
            isLoading: isProcessing,
            disabled: isProcessing
          }}
        >
          {isProcessing ? 'Processing...' : getButtonText()}
        </AppBtn>
      )}
    </div>
  );

  return (
    <div className="fadeIn">
      <Alert
        color="warning"
        variant="faded"
        title="Pod Treasury Balance Exceeded!"
        className="mb-4"
        classNames={{ base: "bg-background" }}
        endContent={endContent}
      >
        <div className="mt-1 text-sm text-secondary">
          Pod treasury balance exceeded by{' '}
          <b className="text-warning">{formatToken(shortage)} {pod.currency}</b>. You can initiate a refund to the GP treasury!

          {/* 额外提示信息 */}
          {(isGPOwner || isGPMultisigOwner) && !mainTransactionExists && (
            <div className="flex items-center gap-1 mt-2 text-red-400">
              <i className="ri-time-line"></i>
              <span>Pod Owner needs to propose first</span>
            </div>
          )}

        </div>
      </Alert>
    </div>
  );
}
