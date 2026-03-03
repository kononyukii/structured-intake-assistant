import { DisclaimerGuard } from '@/features/safety/ui/DisclaimerGuard';

export default function StartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DisclaimerGuard>{children}</DisclaimerGuard>;
}
