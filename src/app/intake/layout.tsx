import { SafetyGuard } from '@/features/safety/ui/SafetyGuard';

export default function IntakeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SafetyGuard>{children}</SafetyGuard>;
}
