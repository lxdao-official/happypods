'use client';
import { QRCodeTooltip } from "./qr-code-tooltip";
import { api } from "~/trpc/react";
import type { ChainType, GrantsPoolTokens } from "@prisma/client";
import { formatToken } from "~/lib/utils";

interface GrantsPoolBalanceProps {
  gpId: number;
  treasuryWallet: string;
  chainType: ChainType;
  token: GrantsPoolTokens;
}

const GrantsPoolBalance = ({ gpId, treasuryWallet, chainType, token }: GrantsPoolBalanceProps) => {
  // 获取资金池余额信息
  const { data: poolBalanceData, isLoading } = api.grantsPool.getPoolBalance.useQuery({ id: gpId });
  
  // 获取USD余额
  const { data: uBalance } = api.wallet.getBalance.useQuery({
    address: treasuryWallet,
    chainType,
    tokenType: token
  }, {
    enabled: !!treasuryWallet && !!chainType
  });


  if (isLoading) {
    return <div>Loading pool balance...</div>;
  }

  const completedAmount = formatToken(Number(poolBalanceData?.completedAmount) || 0);
  const totalAmount = formatToken(Number(poolBalanceData?.totalAmount) || 0);

  // 计算余额（USD 格式化余额）
  const availableUSDC = formatToken(Number(uBalance?.rawBalance || 0));

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3 text-xl">
        <i className="text-2xl ri-arrow-right-s-fill"></i>
        <div className="text-xl font-bold">Grants Pool</div>
        <QRCodeTooltip content={treasuryWallet} />
        <a href={`https://app.safe.global/home?safe=oeth:${treasuryWallet}`} target="_blank" className="hover:opacity-70">
          <i className="ri-external-link-line"></i>
        </a>
      </div>
      <div className="flex items-center">
        <div key={token} className="relative flex items-start gap-1 border border-black rounded-lg md:pr-6 md:gap-6">
          <div className="flex flex-col items-center gap-1 p-2 px-4 border-r border-black">
            <img src={`/tokens/${token}.svg`} alt={token} className="w-6 h-6" />
            <b className="text-xs">{token}</b>
          </div>
          <div className="flex flex-col items-center p-2"><b>{availableUSDC}</b><small>Balance</small></div>
          <div className="flex flex-col items-center p-2"><b>{totalAmount}</b><small>Application</small></div>
          <div className="flex flex-col items-center p-2"><b>{completedAmount}</b><small>Funded</small></div>
        </div>
      </div>
    </div>
  );
};

export default GrantsPoolBalance;
