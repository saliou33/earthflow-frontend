import { Metadata } from "next";
import { WorkflowsClientPage } from "./client-page";

export const metadata: Metadata = {
  title: "Workflows - EarthFlow",
  description: "Manage your spatial data workflows.",
};

export default function WorkflowsPage() {
  return <WorkflowsClientPage />;
}
