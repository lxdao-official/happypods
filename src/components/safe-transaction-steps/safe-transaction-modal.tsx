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
import useStore from '~/store';
import useSafeWallet from '~/hooks/useSafeWallet';
import { ProposalStep } from './ProposalStep';
import { ConfirmationStep } from './ConfirmationStep';
import { ExecutionStep } from './ExecutionStep';
// import { CompletedStep } from './CompletedStep';

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

  // 监听交易处理器变化
  useEffect(() => {
    if (safeTransactionHandler) {
      setIsOpen(true);
      // 打开时先生成 hash，再获取交易详情
      generateTransactionHash();
    }
  }, [safeTransactionHandler]);

  // 处理关闭
  const handleClose = () => {
    setIsOpen(false);
    clearSafeTransactionHandler();
    setTransactionState({
      isDetecting: false,
      isGeneratingHash: false,
    });
    safeTransactionHandler?.onClose?.();
    setTransactionHash('');
    setTransactionDetail(null);
    setWalletInfo(null);
  };

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
      
      // hash 生成成功后，获取交易详情
      await refreshTransactionData(hash);
      
    } catch (error) {
      console.error('生成交易 hash 失败:', error);
      const errorMessage = error instanceof Error ? error.message : '生成交易 hash 失败';
      
      setTransactionState(prev => ({ 
        ...prev, 
        isGeneratingHash: false,
        error: errorMessage 
      }));
      
      toast.error('生成交易 hash 失败', {
        description: errorMessage,
      });
    }
  };

  // 获取交易详情和钱包信息 - 添加防抖保护
  const refreshTransactionData = async (hash?: string) => {
    if (!safeTransactionHandler || !isReady) return;
    
    const targetHash = hash || transactionHash;
    console.log('targetHash===>',{targetHash,hash,transactionHash,isDetecting: transactionState.isDetecting});
    if (!targetHash) return;
    
    // 防抖：如果正在检测中，避免重复调用
    if (transactionState.isDetecting) {
      console.log('refreshTransactionData: 已在检测中，跳过重复调用');
      return;
    }
    
    setTransactionState(prev => ({ ...prev, isDetecting: true, error: undefined }));
    
    try {
      // 并行获取交易详情和钱包信息
      const [detail, wallet] = await Promise.all([
        getTransactionDetail(targetHash),
        getWallet(safeTransactionHandler.safeAddress)
      ]);

      console.log('detail===>',detail);
      
      setTransactionDetail(detail);
      setWalletInfo(wallet);
      
      setTransactionState(prev => ({ ...prev, isDetecting: false }));
      
    } catch (error) {
      console.error('获取交易数据失败:', error);
      const errorMessage = error instanceof Error ? error.message : '获取交易数据失败';
      
      setTransactionState(prev => ({ 
        ...prev, 
        isDetecting: false,
        error: errorMessage 
      }));
      
      toast.error('获取交易数据失败', {
        description: errorMessage,
      });
    }
  };

  if (!safeTransactionHandler) return null;

  return (
    isOpen && //确保每次都是重新挂在
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="2xl"
      isDismissable={true}
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
                  {safeTransactionHandler.title || 'SafeWallet 交易'}
                </h2>
                <p className="text-small text-default-500">多签钱包交易处理流程</p>
              </div>
            </div>
            
            {/* 刷新按钮 */}
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={() => refreshTransactionData()}
              isLoading={transactionState.isDetecting}
            >
              <i className="ri-refresh-line"></i>
            </Button>
          </div>
        </ModalHeader>
        
        <ModalBody className="py-6">
          {/* hash 生成状态 */}
          {transactionState.isGeneratingHash && (
            <Card className="border-warning/20 bg-warning/5">
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <i className="text-lg ri-loader-line text-warning animate-spin"></i>
                  <span className="text-small text-warning">正在生成交易 hash...</span>
                </div>
              </CardBody>
            </Card>
          )}
          
          {/* 状态检测加载 */}
          {transactionState.isDetecting && (
            <Card className="border-primary/20 bg-primary/5">
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <i className="text-lg ri-loader-line text-primary animate-spin"></i>
                  <span className="text-small text-primary">正在获取交易数据...</span>
                </div>
              </CardBody>
            </Card>
          )}

          {/* 交易详情 */}
          <Card className="bg-default-50/50">
            <CardBody className="p-4">
              <h4 className="flex items-center gap-2 mb-3 font-medium">
                <i className="ri-information-line text-default-500"></i>
                交易详情
              </h4>
              
              <div className="space-y-3 text-small">
                {safeTransactionHandler.description && (
                  <div className='space-y-2'>
                    <span className="text-default-500">交易描述 </span>
                    <div className="text-default-700">{safeTransactionHandler.description}</div>
                  </div>
                )}
                
                <div className='flex gap-2'>
                  <span className="text-default-500">Safe 地址: </span>
                  <code className="px-2 py-1 rounded text-tiny bg-default-100">
                    {safeTransactionHandler.safeAddress}
                  </code>
                </div>

                {
                walletInfo && <div className='flex gap-2'>
                  <span className="flex-shrink-0 text-default-500">多签参与者: </span>
                  
                  <div className="flex flex-wrap gap-2">
                  {
                      walletInfo.owners.map((owner:any)=>{
                        return <code className="px-2 py-1 rounded text-tiny bg-default-100" key={owner}>
                          {owner}
                        </code>
                      })
                    }
                  </div>
                  
                </div>
                }
                
                <div className='flex gap-2'>
                  <span className="text-default-500">交易哈希: </span>
                  <code className="px-2 py-1 rounded text-tiny bg-default-100">
                    {transactionHash || '生成中...'}
                  </code>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* 处理步骤 */}
          <Card className="bg-default-50/50">
            <CardBody className="p-4">
              <h4 className="flex items-center gap-2 mb-4 font-medium">
                <i className="ri-timeline-view text-default-500"></i>
                处理流程
              </h4>
              
              <div className="space-y-4">
                {/* 创建提案步骤 */}
                <ProposalStep
                  transactionHash={transactionHash}
                  safeAddress={safeTransactionHandler.safeAddress}
                  transfers={safeTransactionHandler.transfers}
                  transactionDetail={transactionDetail}
                  walletInfo={walletInfo}
                  onComplete={() => refreshTransactionData()}
                  onStepChange={safeTransactionHandler.onStepChange}
                />
                
                {/* 多签确认步骤 */}
                <ConfirmationStep
                  transactionHash={transactionHash}
                  safeAddress={safeTransactionHandler.safeAddress}
                  transactionDetail={transactionDetail}
                  walletInfo={walletInfo}
                  onComplete={() => refreshTransactionData()}
                  onStepChange={safeTransactionHandler.onStepChange}
                />
                
                {/* 执行交易步骤 */}
                <ExecutionStep
                  transactionHash={transactionHash}
                  safeAddress={safeTransactionHandler.safeAddress}
                  transactionDetail={transactionDetail}
                  walletInfo={walletInfo}
                  onComplete={() => refreshTransactionData()}
                  onStepChange={safeTransactionHandler.onStepChange}
                />
                
                {/* 交易完成步骤 */}
                {/* <CompletedStep
                  transactionHash={transactionHash}
                  safeAddress={safeTransactionHandler.safeAddress}
                  transactionDetail={transactionDetail}
                  walletInfo={walletInfo}
                  onStepChange={safeTransactionHandler.onStepChange}
                /> */}
              </div>
            </CardBody>
          </Card>

          {/* 错误信息 */}
          {transactionState.error && (
            <Card className="border-danger/20 bg-danger/5">
              <CardBody className="p-4">
                <div className="flex items-start gap-3">
                  <i className="text-xl ri-error-warning-line text-danger"></i>
                  <div>
                    <h4 className="font-medium text-danger">获取数据失败</h4>
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
