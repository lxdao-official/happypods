import { Chip, Select, SelectItem } from "@heroui/react";
import CornerFrame from "~/components/corner-frame";
import { api } from "~/trpc/react";
import { useMemo } from "react";

interface GrantsPoolInfoSectionProps {
  grantsPoolId: string;
  rfpIndex: string;
  currency: string;
  onGrantsPoolChange: (grantsPoolId: string) => void;
  onRfpChange: (rfpIndex: string) => void;
  onCurrencyChange: (currency: string) => void;
  isPreselected: boolean;
}

const GrantsPoolInfoSection = ({
  grantsPoolId,
  rfpIndex,
  currency,
  onGrantsPoolChange,
  onRfpChange,
  onCurrencyChange,
  isPreselected,
}: GrantsPoolInfoSectionProps) => {
  // API queries
  const { data: grantsPools, isLoading: grantsPoolsLoading } = api.grantsPool.getActiveGrantsPools.useQuery();
  const { data: grantsPoolDetails, isLoading: poolDetailsLoading } = api.pod.getGrantsPoolDetails.useQuery(
    { id: parseInt(grantsPoolId) },
    { enabled: !!grantsPoolId }
  );

  // 获取选中GP的RFP
  const selectedPool = grantsPools?.find(gp => gp.id.toString() === grantsPoolId);
  const selectedRfp = grantsPoolDetails?.rfps?.find(rfp => rfp.id.toString() === rfpIndex);

  // 获取可用的currency选项
  const currencyOptions = grantsPoolDetails?.availableTokens || [];

  const grantsPoolsRes = useMemo(()=>{
    return grantsPools?.map(v=>({key:v.id.toString(),label:`${v.name} (${v.chainType})`}))
  },[grantsPools])

  const rfpOptions = useMemo(()=>{
    return grantsPoolDetails?.rfps?.map((rfp, index)=>({key:index.toString(),label:rfp.title})) || []
  },[grantsPoolDetails?.rfps])

  const currencyOptionsRes = useMemo(()=>{
    return currencyOptions?.map(token=>({key:token.symbol,label:`${token.symbol} (Available: ${token.available})`})) || []
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
                        {selectedPool?.chainType || "N/A"}
                    </Chip>
                </div>
                <div className="text-sm text-secondary">{selectedPool?.name || "Loading..."}</div>
            </div>
          </div>
        ) : (
          <Select
            variant="bordered"
            label="Select Grants Pool"
            isRequired
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
            variant="bordered"
            label="Select RFP"
            isRequired
            placeholder="Please select an RFP"
            selectedKeys={rfpIndex ? new Set([rfpIndex]) : new Set()}
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
          variant="bordered"
          label="Currency"
          isRequired
          placeholder="Select currency"
          selectedKeys={currency ? new Set([currency]) : new Set()}
          onSelectionChange={(keys) => {
            const newCurrency = Array.from(keys)[0] as string;
            onCurrencyChange(newCurrency || "");
          }}
          isDisabled={!grantsPoolId}
          description="Available tokens with balance > 0"
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