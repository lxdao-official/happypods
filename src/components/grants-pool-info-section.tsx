import { Chip, Select, SelectItem } from "@heroui/react";
import CornerFrame from "~/components/corner-frame";
import { api } from "~/trpc/react";
import { useMemo, useEffect } from "react";
import type { ChainType } from "@prisma/client";

interface GrantsPoolInfoSectionProps {
  grantsPoolId: string;
  rfpId: string;
  currency: string;
  onGrantsPoolChange: (grantsPoolId: string) => void;
  onRfpChange: (rfpId: string) => void;
  onCurrencyChange: (currency: string) => void;
  onBalanceChange: (balance: number) => void; // 新增余额回调
  isPreselected: boolean;
}

const GrantsPoolInfoSection = ({
  grantsPoolId,
  rfpId,
  currency,
  onGrantsPoolChange,
  onRfpChange,
  onCurrencyChange,
  onBalanceChange,
  isPreselected,
}: GrantsPoolInfoSectionProps) => {
  // API queries
  const { data: grantsPools, isLoading: grantsPoolsLoading } = api.grantsPool.getActiveGrantsPools.useQuery();
  const { data: grantsPoolDetails, isLoading: poolDetailsLoading } = api.pod.getGrantsPoolDetails.useQuery(
    { id: parseInt(grantsPoolId) },
    { enabled: !!grantsPoolId }
  );

  // 获取选中GP的RFP和信息
  const selectedPool = grantsPools?.find(gp => gp.id.toString() === grantsPoolId);
  const selectedRfp = grantsPoolDetails?.rfps?.find(rfp => rfp.id.toString() === rfpId);


  // 使用 tokens 数组作为币种选项
  const currencyOptions = selectedPool?.tokens || [];

  // 查询余额（当币种和GP都选择后）
  const { data: balanceData, isLoading: balanceLoading } = api.wallet.getBalance.useQuery({
    address: selectedPool?.treasuryWallet || '',
    chainType: selectedPool?.chainType!,
    tokenType: currency as any
  }, {
    enabled: !!(selectedPool?.treasuryWallet && currency && selectedPool?.chainType)
  });

  // 当余额数据变化时，通知父组件
  useEffect(() => {
    if (balanceData?.formattedBalance) {
      onBalanceChange(Number(balanceData.formattedBalance));
    }
  }, [balanceData?.formattedBalance, onBalanceChange]);

  const grantsPoolsRes = useMemo(()=>{
    return grantsPools?.map(v=>({key:v.id.toString(),label:`${v.name} (${v.chainType})`}))
  },[grantsPools])

  const rfpOptions = useMemo(() => {
    return grantsPoolDetails?.rfps?.map((rfp) => ({
      key: rfp.id.toString(),
      label: rfp.title
    })) || []
  }, [grantsPoolDetails?.rfps])

  const currencyOptionsRes = useMemo(()=>{
    return currencyOptions?.map(token=>({
      key: token, 
      label: token
    })) || []
  },[currencyOptions])
  

  return (
    <CornerFrame backgroundColor="var(--color-background)" color="gray">

      <h2 className="mb-6 text-xl">Grants Pool Information</h2>
      <div className="space-y-6">
        {/* 选择Grants Pool */}
        {isPreselected ? (
          <div className="flex items-center space-x-3">
            {selectedPool?.avatar && (
              <img 
                src={selectedPool.avatar} 
                alt={selectedPool.name} 
                className="object-cover w-12 h-12 rounded-full"
              />
            )}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold">
                    <span>{selectedRfp?.title || "Loading..."}</span>
                    <Chip color="success" variant="flat" size="sm">
                        {selectedPool?.chainType || "~"}
                    </Chip>
                </div>
                <div className="text-sm text-secondary">{selectedPool?.name || "Loading..."}</div>
            </div>
          </div>
        ) : (
          <Select
            variant="faded"
            label="Select Grants Pool"
            isRequired
            errorMessage="Please select a Grants Pool"
            placeholder="Please select a Grants Pool"
            selectedKeys={grantsPoolId ? new Set([grantsPoolId]) : new Set()}
            onSelectionChange={(keys) => {
              const newGrantsPoolId = Array.from(keys)[0] as string;
              onGrantsPoolChange(newGrantsPoolId || "");
            }}
            isLoading={grantsPoolsLoading}
          >
            {grantsPoolsRes?.map((gp) => (
              <SelectItem key={gp.key}>
                {gp.label}
              </SelectItem>
            )) ?? []}
          </Select>
        )}

        {/* RFP选择 */}
        {!isPreselected && (
          <Select
            variant="faded"
            label="Select RFP"
            isRequired
            errorMessage="Please select an RFP"
            placeholder="Please select an RFP"
            selectedKeys={rfpId ? new Set([rfpId]) : new Set()}
            onSelectionChange={(keys) => {
              const newRfpIndex = Array.from(keys)[0] as string;
              onRfpChange(newRfpIndex || "");
            }}
            isLoading={poolDetailsLoading}
            isDisabled={!grantsPoolId}
          >
            {rfpOptions.map((rfp) => (
              <SelectItem key={rfp.key}>
                {rfp.label}
              </SelectItem>
            ))}
          </Select>
        )}

        {/* 申请币种 */}
        <Select
          variant="faded"
          label="Currency"
          isRequired
          errorMessage="Please select a currency"
          placeholder="Select currency"
          selectedKeys={currency ? new Set([currency]) : new Set()}
          onSelectionChange={(keys) => {
            const newCurrency = Array.from(keys)[0] as string;
            onCurrencyChange(newCurrency || "");
          }}
          isDisabled={!grantsPoolId}
          description={
            balanceLoading ? "Loading..." : 
            balanceData?.formattedBalance 
            ? `Available: ${balanceData.formattedBalance} ${currency}` 
            : "Available: 0.00"
          }
        >
          {currencyOptionsRes.map((token) => (
            <SelectItem key={token.key}>
              {token.label}
            </SelectItem>
          ))}
        </Select>
      </div>
    </CornerFrame>
  );
};

export default GrantsPoolInfoSection; 