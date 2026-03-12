import { useCases } from "@/lib/use-cases";
import type { OpportunityStage, Decision } from "@/lib/types";
import PipelineClient from "./pipeline-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PipelinePage() {
  const [pipeline, vq] = await Promise.all([
    useCases.listPipelineWithDecisions(),
    useCases.listValidationQueue(),
  ]);

  return <PipelineClient pipeline={pipeline} validationQueue={vq} />;
}
