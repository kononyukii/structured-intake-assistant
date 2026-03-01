import { Page, PageBody, PageHeader } from '@/shared/ui/layout/page-layout';

export default function DraftsPage() {
  return (
    <Page>
      <PageHeader>
        <span className="text-xl font-bold tracking-tight">Drafts</span>
      </PageHeader>
      <PageBody>
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-muted-foreground text-lg">
            Your drafts will appear here.
          </p>
        </div>
      </PageBody>
    </Page>
  );
}
