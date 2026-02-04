import { AppShell } from "@/components/shell";
import { UpdatePrompt } from "@/components/update-prompt";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <UpdatePrompt />
      <AppShell>{children}</AppShell>
    </>
  );
}
