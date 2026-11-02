import { Settings as SettingsIcon } from "lucide-react";
import PagePlaceholder from "../components/ui/PagePlaceholder";

export default function Settings() {
  return (
    <PagePlaceholder
      title="Settings"
      description="Manage users, roles, integrations, scan schedules, and platform configuration."
      icon={SettingsIcon}
    />
  );
}
