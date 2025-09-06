"use client";

import { useEffect, useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Card,
  CardBody,
} from '@heroui/react';
import { toast } from 'sonner';
import useStore, { SafeStepStatus, SafeTransactionStep } from '~/store';
import useSafeWallet from '~/hooks/useSafeWallet';
import { ProposalStep } from './ProposalStep';
import { ConfirmationStep } from './ConfirmationStep';
import { ExecutionStep } from './ExecutionStep';
import Link from 'next/link';
import { truncateString } from '~/lib/utils';

// 简化的状态接口
interface TransactionState {
  isDetecting: boolean;
  isGeneratingHash: boolean;
  error?: string;
}

export function SafeTransactionModal() {
  const {
    safeTransactionHandler,
    clearSafeTransactionHandler
  } = useStore();


  const {
    getTransactionDetail,
    getWallet,
    isReady,
    initSafeInstance
  } = useSafeWallet();

  const [isOpen, setIsOpen] = useState(true);
  const [transactionState, setTransactionState] = useState<TransactionState>({
    isDetecting: false,
    isGeneratingHash: false,
  });

  const [transactionHash, setTransactionHash] = useState<string>('');
  const [transactionDetail, setTransactionDetail] = useState<any>(null);
  const [walletInfo, setWalletInfo] = useState<any>(null);


  // 生成交易 hash
  const generateTransactionHash = async () => {
    if (!safeTransactionHandler || !isReady) return;

    setTransactionState(prev => ({ ...prev, isGeneratingHash: true, error: undefined }));

    try {
      // 使用 Safe 实例生成交易 hash
      const safeInstance = await initSafeInstance(safeTransactionHandler.safeAddress);
      const safeTransaction = await safeInstance.createTransaction({
        transactions: safeTransactionHandler.transfers
      });
      const hash = await safeInstance.getTransactionHash(safeTransaction);

      console.log('Generated transaction hash:', hash);
      setTransactionHash(hash);
      setTransactionState(prev => ({ ...prev, isGeneratingHash: false }));
      refreshTransactionData();
    } catch (error) {
      console.error('生成交易 hash 失败:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate transaction hash';

      setTransactionState(prev => ({
        ...prev,
        isGeneratingHash: false,
        error: errorMessage
      }));

      toast.error('Failed to generate transaction hash', {
        description: errorMessage,
      });
    }
  };

  // 获取交易详情和钱包信息 - 添加防抖保护
  const refreshTransactionData = async () => {
    console.log('targetHash===>', {transactionHash, isDetecting: transactionState.isDetecting,safeTransactionHandler, isReady});
    console.log(safeTransactionHandler, isReady, transactionHash);
    console.log(!safeTransactionHandler || !isReady || !transactionHash);
    if (!safeTransactionHandler || !isReady || !transactionHash) return;

    // 防抖：如果正在检测中，避免重复调用
    if (transactionState.isDetecting) {
      console.log('refreshTransactionData: 已在检测中，跳过重复调用');
      return;
    }

    setTransactionState(prev => ({ ...prev, isDetecting: true, error: undefined }));

    try {
      // 并行获取交易详情和钱包信息
      const [detail, wallet] = await Promise.all([
        getTransactionDetail(transactionHash),
        getWallet(safeTransactionHandler.safeAddress)
      ]);

      console.log('detail===>', detail);

      setTransactionDetail(detail);
      setWalletInfo(wallet);

      setTransactionState(prev => ({ ...prev, isDetecting: false }));

      if(!detail) return;
      if(detail.isExecuted) {
        //交易已执行完成
        safeTransactionHandler?.onStepChange?.(SafeTransactionStep.EXECUTION, SafeStepStatus.SUCCESS, { transactionHash });
      } else if(detail.confirmations && detail.confirmations.length >= detail.confirmationsRequired) {
        //签名已达到阈值，可以执行
        safeTransactionHandler?.onStepChange?.(SafeTransactionStep.WAITEXECUTION, SafeStepStatus.SUCCESS, { transactionHash });
      } else if(detail.confirmations && detail.confirmations.length > 0) {
        //有签名但未达到阈值
        safeTransactionHandler?.onStepChange?.(SafeTransactionStep.CONFIRMATION, SafeStepStatus.SUCCESS, { transactionHash });
      }else if(!detail.isExecuted){
        // 只是提案成功
        safeTransactionHandler?.onStepChange?.(SafeTransactionStep.PROPOSAL, SafeStepStatus.SUCCESS, { transactionHash });
      }

    } catch (error) {
      console.error('获取交易数据失败:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transaction data';

      setTransactionState(prev => ({
        ...prev,
        isDetecting: false,
        error: errorMessage
      }));

      toast.error('Failed to fetch transaction data', {
        description: errorMessage,
      });
    }
  };


  // 处理关闭
  const handleClose = (init = false) => {
    !init && safeTransactionHandler?.onClose?.();
    !init && setIsOpen(false);
    !init && clearSafeTransactionHandler();
    setTransactionState({
      isDetecting: false,
      isGeneratingHash: false,
    });
    setTransactionHash('');
    setTransactionDetail(null);
    setWalletInfo(null);
  };

  // 监听交易处理器变化
  useEffect(() => {
    if (safeTransactionHandler) {
      handleClose(true);
      setIsOpen(true);
      generateTransactionHash();
    }
  }, [safeTransactionHandler]);


  useEffect(()=>{
    transactionHash && refreshTransactionData();
  },[transactionHash]);

  if (!safeTransactionHandler) return null;

  return (
    isOpen && //确保每次都是重新挂在
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
      isDismissable={false}
    >
      <ModalContent className="bg-gradient-to-br from-background to-default-50">
        <ModalHeader className="flex flex-col gap-1 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <i className="text-xl ri-safe-line text-primary"></i>
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {safeTransactionHandler.title || 'SafeWallet Transaction'}
                </h2>
                <p className="text-small text-default-500">Multi-signature wallet transaction process</p>
              </div>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="py-6 fadeIn max-h-[80vh] overflow-y-auto">
          {/* 互斥状态显示 */}
          {transactionState.isGeneratingHash ? (
            <Card className="border-warning/20 bg-warning/5">
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <i className="text-lg ri-loader-line text-warning animate-spin"></i>
                  <span className="text-small text-warning">Generating transaction hash...</span>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card className="overflow-visible bg-default-50/50 fadeIn">
              <CardBody className="p-4">
                <div className='flex items-center justify-between mb-3'>
                  <h4 className="flex items-center gap-2 font-medium">
                    <i className="ri-information-line text-default-500"></i>
                    <span>Transaction Details</span>
                  </h4>


                  {/* 刷新按钮 */}
                  <div className='flex items-center space-x-2'>
                    {
                      !transactionState.isDetecting && <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        onPress={() => refreshTransactionData()}
                      >
                        <i className="text-xl ri-refresh-line"></i>
                      </Button>
                    }

                    {transactionHash && (
                      <Link href={`https://app.safe.global/transactions/tx?safe=oeth:${safeTransactionHandler.safeAddress}&id=multisig_${safeTransactionHandler.safeAddress}_${transactionHash}`} target='_blank'>
                        <Button
                          isIconOnly
                          variant="light"
                          size="sm"
                          isLoading={transactionState.isDetecting}
                        >
                          <i className="text-xl ri-external-link-line"></i>
                        </Button>
                      </Link>
                    )}

                  </div>

                </div>

                <div className="space-y-3 text-small">
                  {safeTransactionHandler.description && (
                    <div className='space-y-2'>
                      <span className="text-default-500">Description </span>
                      <div className="text-default-700">{safeTransactionHandler.description}</div>
                    </div>
                  )}

                  <div className='flex flex-col gap-2 md:flex-row '>
                    <span className="text-default-500">Safe Wallet: </span>
                    <code className="px-2 py-1 rounded text-tiny bg-default-100">
                      {truncateString(safeTransactionHandler.safeAddress)}
                    </code>
                  </div>

                  {
                    walletInfo && <div className='flex flex-col gap-2 md:flex-row'>
                      <span className="flex-shrink-0 text-default-500">Members: </span>

                      <div className="flex flex-wrap gap-2">
                        {
                          walletInfo.owners.map((owner: any) => {
                            return <code className="px-2 py-1 rounded text-tiny bg-default-100" key={owner}>
                              {truncateString(owner)}
                            </code>
                          })
                        }
                      </div>

                    </div>
                  }

                  <div className='flex flex-col gap-2 md:flex-row'>
                    <span className="text-default-500">Safe Hash: </span>
                    <code className="px-2 py-1 rounded text-tiny bg-default-100">
                      {truncateString(transactionHash) || '...'}
                    </code>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* 处理步骤 - 只在显示信息状态时显示 */}
          {!transactionState.isGeneratingHash && (
            <Card className="overflow-visible bg-default-50/50">
              <CardBody className="p-4">

                <div className='flex items-center mb-4 space-x-4'>
                  <h4 className="flex items-center gap-2 font-medium">
                    <i className="ri-timeline-view text-default-500"></i>
                    Process Flow
                  </h4>
                </div>

                <div className="space-y-4">
                  {/* 创建提案步骤 */}
                  <ProposalStep
                    transactionHash={transactionHash}
                    safeAddress={safeTransactionHandler.safeAddress}
                    transfers={safeTransactionHandler.transfers}
                    transactionDetail={transactionDetail}
                    walletInfo={walletInfo}
                    onComplete={() => refreshTransactionData()}
                  />

                  {/* 多签确认步骤 */}
                  <ConfirmationStep
                    transactionHash={transactionHash}
                    safeAddress={safeTransactionHandler.safeAddress}
                    transactionDetail={transactionDetail}
                    walletInfo={walletInfo}
                    onComplete={() => refreshTransactionData()}
                  />

                  {/* 执行交易步骤 */}
                  <ExecutionStep
                    transactionHash={transactionHash}
                    safeAddress={safeTransactionHandler.safeAddress}
                    transactionDetail={transactionDetail}
                    walletInfo={walletInfo}
                    onComplete={() => refreshTransactionData()}
                  />

                </div>
              </CardBody>
            </Card>
          )}

          {/* 错误信息 */}
          {transactionState.error && (
            <Card className="border-danger/20 bg-danger/5 fadeIn">
              <CardBody className="p-4">
                <div className="flex items-start gap-3">
                  <i className="text-xl ri-error-warning-line text-danger"></i>
                  <div>
                    <h4 className="font-medium text-danger">Failed to fetch data</h4>
                    <p className="text-small text-danger/80">{transactionState.error}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
