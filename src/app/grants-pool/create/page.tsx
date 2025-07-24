"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Input, 
  Textarea, 
  Select, 
  SelectItem
} from "@heroui/react";
import CornerFrame from "~/components/corner-frame";
import AppBtn from "~/components/app-btn";
import RFPSection from "~/components/rfp-section";
import RelatedLinksSection from "~/components/related-links-section";
import { api } from "~/trpc/react";

interface RFP {
  id: string;
  title: string;
  description: string;
}

interface RelatedLinks {
  website: string;
  github: string;
  twitter: string;
  telegram: string;
}

export default function CreateGrantsPoolPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    avatar: "",
    name: "",
    description: "",
    tags: "",
    treasuryWallet: "",
    chainType: "ETHEREUM" as "ETHEREUM" | "OPTIMISM",
    // Moderator info
    modName: "",
    modEmail: "",
    modTelegram: "",
  });

  // RFP 数据 - 支持多个RFP
  const [rfps, setRfps] = useState<RFP[]>([
    {
      id: "1",
      title: "",
      description: ""
    }
  ]);

  // Related Links 数据
  const [relatedLinks, setRelatedLinks] = useState<RelatedLinks>({
    website: "",
    github: "",
    twitter: "",
    telegram: "",
  });

  const createGrantsPoolMutation = api.grantsPool.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.treasuryWallet) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const links = {
        ...(relatedLinks.website && { website: relatedLinks.website }),
        ...(relatedLinks.github && { github: relatedLinks.github }),
        ...(relatedLinks.twitter && { twitter: relatedLinks.twitter }),
        ...(relatedLinks.telegram && { telegram: relatedLinks.telegram }),
      };

      // 处理多个RFP
      const processedRfps = rfps.map(rfp => ({
        title: rfp.title || "Default RFP",
        description: rfp.description || "Please provide RFP description"
      }));

      const modInfo = {
        name: formData.modName || "Not set",
        email: formData.modEmail || "Not set",
        telegram: formData.modTelegram || "Not set",
      };

      await createGrantsPoolMutation.mutateAsync({
        avatar: formData.avatar || undefined,
        name: formData.name,
        description: formData.description,
        tags: formData.tags || undefined,
        treasuryWallet: formData.treasuryWallet,
        chainType: formData.chainType,
        links: Object.keys(links).length > 0 ? links : undefined,
        rfp: processedRfps[0], // 保持向后兼容，使用第一个RFP
        modInfo,
      });

      alert("Grants Pool created successfully!");
      router.push("/grants-pool");
    } catch (error) {
      console.error("Failed to create Grants Pool:", error);
      alert("Creation failed, please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Create Grants Pool</h1>
          <p className="mt-2 text-default-500">Fill in the following information to create your Grants Pool</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Information */}
          <CornerFrame backgroundColor="var(--color-background)" color="gray">
            <h2 className="mb-6 text-xl">General Information</h2>
            <div className="space-y-6">
              {/* Avatar */}
              <Input
                variant="bordered"
                type="url"
                label="Avatar URL"
                value={formData.avatar}
                onChange={(e) => handleInputChange("avatar", e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                description="Enter the URL of the avatar image"
              />

              {/* Name */}
              <Input
                variant="bordered"
                type="text"
                label="Grants Pool Name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter the name of the Grants Pool"
                isRequired
              />

              {/* Description */}
              <Textarea
                variant="bordered"
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe the goals, vision, and funding direction of your Grants Pool"
                isRequired
                minRows={4}
              />

              {/* Chain Type */}
              <Select
                variant="bordered"
                label="Treasury Chain Type"
                value={formData.chainType}
                onChange={(e) => handleInputChange("chainType", e.target.value)}
                isRequired
              >
                <SelectItem key="ETHEREUM">Ethereum Mainnet</SelectItem>
                <SelectItem key="OPTIMISM">Optimism Network</SelectItem>
              </Select>

              {/* Tags */}
              <Input
                variant="bordered"
                type="text"
                label="Tags"
                value={formData.tags}
                onChange={(e) => handleInputChange("tags", e.target.value)}
                placeholder="DeFi,Web3,DAO"
                description="Separate multiple tags with commas"
              />
            </div>
          </CornerFrame>

          {/* RFP Information - 使用新组件 */}
          <RFPSection 
            rfps={rfps}
            onRfpsChange={setRfps}
          />

          {/* Moderator Information */}
          <CornerFrame backgroundColor="var(--color-background)" color="gray" >
            <h2 className="mb-6 text-xl">Moderator Information</h2>
            <div className="space-y-6">
              <Input
                variant="bordered"
                type="text"
                label="Moderator Name"
                value={formData.modName}
                onChange={(e) => handleInputChange("modName", e.target.value)}
                placeholder="Moderator Name"
              />

              <Input
                variant="bordered"
                type="email"
                label="Moderator Email"
                value={formData.modEmail}
                onChange={(e) => handleInputChange("modEmail", e.target.value)}
                placeholder="admin@example.com"
              />

              <Input
                variant="bordered"
                type="text"
                label="Moderator Telegram"
                value={formData.modTelegram}
                onChange={(e) => handleInputChange("modTelegram", e.target.value)}
                placeholder="@username"
              />
            </div>
          </CornerFrame>

          {/* Related Links - 使用新组件 */}
          <RelatedLinksSection 
            links={{
              website: relatedLinks.website,
              github: relatedLinks.github,
              twitter: relatedLinks.twitter,
              telegram: relatedLinks.telegram
            }}
            onLinksChange={(links: Record<string, string>) => {
              setRelatedLinks({
                website: links.website || '',
                github: links.github || '',
                twitter: links.twitter || '',
                telegram: links.telegram || ''
              });
            }}
          />

          {/* Submit Button */}
          <div className="flex items-center justify-center">
            <AppBtn
              btnProps={{
                type: "submit",
                color: "primary",
                isLoading: isSubmitting,
                className: "flex-1",
                size: "lg",
              }}
            >
              {isSubmitting ? "Creating..." : "Create Grants Pool"}
            </AppBtn>
          </div>
        </form>
      </div>
    </div>
  );
} 