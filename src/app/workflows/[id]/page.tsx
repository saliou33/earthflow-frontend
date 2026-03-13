import { Metadata } from "next";
import { WorkflowEditorClientPage } from "./client-page";

export const metadata: Metadata = {
  title: "Workflow Editor - EarthFlow",
  description: "Edit your spatial data workflow.",
};

export default async function WorkflowEditorPage({
    params,
  }: {
    params: Promise<{ id: string }>;
  }) {
  const { id } = await params;
  return <WorkflowEditorClientPage workflowId={id} />;
}
