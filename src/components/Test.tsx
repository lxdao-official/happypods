'use client';
import { Button } from "@heroui/react";
import useSafeWallet from "~/hooks/useSafeWallet";
import { buildErc20TransfersSafeTransaction } from "~/lib/safeUtils";

export default function Test() {
    const {
      proposeOrExecuteTransaction,
      confirmTransactionViaNestedMultisig,
    } = useSafeWallet();
    
    const tx = [
      {
        to: '0x2627b9f8f75dbc2870232715520ffaa24248bc76',
        token:'USDT',
        amount: '15'
      }
    ] as any

    const tian = async()=>{
        const res = await proposeOrExecuteTransaction("0xEf3FaBaf0FBFDDc25BC0F64dbbAbA03F7B7a351D",tx);
        console.log(res);
    }


    // 嵌套多签确认：C钱包（通过D和E）确认A钱包的交易
    const confirmViaNestedMultisig = async () => {
      const targetSafeAddress = '0xEf3FaBaf0FBFDDc25BC0F64dbbAbA03F7B7a351D'; // A钱包地址
      const targetSafeTxHash = '0xebe3b333043c6c7e80fa25f1b2e1fee348fb800b8b0866c0193b7c14e6d97951'; // A钱包的交易hash
      const nestedSafeAddress = '0xd4eF1228187a81914b919b68B94622bFDC0C6365'; // 请替换为实际的C钱包地址
      
      try {
        const result = await confirmTransactionViaNestedMultisig(
          targetSafeAddress,
          targetSafeTxHash,
          nestedSafeAddress
        );
        console.log('嵌套多签确认结果:', result);
      } catch (error) {
        console.error('嵌套多签确认失败:', error);
      }
    }

    // 嵌套多签发起提案：C钱包（通过D和E）在A钱包中发起新的交易提案
    const proposeViaNestedMultisig = async () => {
      const targetSafeAddress = '0xEf3FaBaf0FBFDDc25BC0F64dbbAbA03F7B7a351D'; // A钱包地址
      const nestedSafeAddress = '0xd4eF1228187a81914b919b68B94622bFDC0C6365'; // C钱包地址
      const newTransfers = [
        {
          to: '0x1234567890123456789012345678901234567890',
          token: 'USDT',
          amount: '20'
        }
      ] as any;
      
      // try {
      //   const result = await proposeTransactionViaNestedMultisig(
      //     targetSafeAddress,
      //     nestedSafeAddress,
      //     newTransfers
      //   );
      //   console.log('嵌套发起提案结果:', result);
      // } catch (error) {
      //   console.error('嵌套发起提案失败:', error);
      // }
    }

    // 确认嵌套提案：确认C钱包中的"发起A钱包提案"交易
    const confirmNestedProposalTest = async () => {
      const targetSafeAddress = '0xEf3FaBaf0FBFDDc25BC0F64dbbAbA03F7B7a351D'; // A钱包地址
      const nestedSafeAddress = '0xd4eF1228187a81914b919b68B94622bFDC0C6365'; // C钱包地址
      const nestedSafeTxHash = '0x1234567890abcdef'; // C钱包中的交易hash，需要从proposeViaNestedMultisig的结果中获取
      const targetSafeTransaction = null; // 需要从之前的结果中获取
      const targetSafeTxHash = '0xabcdef1234567890'; // 需要从之前的结果中获取
      
      // try {
      //   const result = await confirmNestedProposal(
      //     nestedSafeAddress,
      //     nestedSafeTxHash,
      //     targetSafeAddress,
      //     targetSafeTransaction,
      //     targetSafeTxHash
      //   );
      //   console.log('确认嵌套提案结果:', result);
      // } catch (error) {
      //   console.error('确认嵌套提案失败:', error);
      // }
    }

    return (
      <div className="p-6 space-y-4">
        
        <div className="pt-4 space-y-2 border-t">
          <h3 className="text-lg font-semibold">嵌套多签操作</h3>
          <div className="mb-2 text-sm text-gray-600">
            场景：A钱包(B+C) {'->'} C钱包(D+E)
            <br />
            A钱包: 0xEf3FaBaf0FBFDDc25BC0F64dbbAbA03F7B7a351D
            <br />
            C钱包: 0xd4eF1228187a81914b919b68B94622bFDC0C6365
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-md">确认已存在交易</h4>
            <Button 
              onPress={confirmViaNestedMultisig} 
              color="warning"
              className="w-full"
            >
              🔐 嵌套多签确认 (D/E {'->'} C {'->'} A)
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-md">发起新的交易提案</h4>
            <Button 
              onPress={proposeViaNestedMultisig} 
              color="primary"
              className="w-full"
            >
              🚀 C钱包在A钱包中发起新提案 (D/E {'->'} C {'->'} A)
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-md">确认嵌套提案</h4>
            <Button 
              onPress={confirmNestedProposalTest} 
              color="secondary"
              className="w-full"
              isDisabled
            >
              ✅ 确认C钱包的提案交易 (需要先发起提案)
            </Button>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            <strong>使用说明：</strong>
            <br />
            1. 🔐 确认交易：C钱包确认A钱包中已存在的交易
            <br />
            2. 🚀 发起提案：C钱包在A钱包中发起新的交易提案
            <br />
            3. ✅ 确认提案：确认C钱包中的"发起A钱包提案"交易
          </div>
        </div>
      </div>
    );
}