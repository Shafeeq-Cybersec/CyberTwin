import { FileText } from "lucide-react";
import PagePlaceholder from "../components/ui/PagePlaceholder";

export default function Reports() {
  return (
    <PagePlaceholder
      title="Reports"
      description="Generate executive summaries, compliance reports, and technical deep-dives from your twin and findings data."
      icon={FileText}
    />
  );
}
