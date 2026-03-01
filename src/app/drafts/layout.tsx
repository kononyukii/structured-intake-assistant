import { DisclaimerGuard } from '@/features/safety/ui/DisclaimerGuard';

export default function DraftsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DisclaimerGuard>{children}</DisclaimerGuard>;
}
