"use client";

import { useParams } from "next/navigation";
import { CampaignDetailsView } from "@/components/marketing/campaign-details-view";

export default function CampaignDetailsPage() {
  const params = useParams<{ id: string }>();
  return <CampaignDetailsView id={params.id} />;
}

