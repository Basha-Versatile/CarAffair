import MarketingHeader from '@/components/marketing/MarketingHeader';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import AtmosphericBackground from '@/components/marketing/AtmosphericBackground';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col grain">
      <AtmosphericBackground />
      <MarketingHeader />
      <main className="relative flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
