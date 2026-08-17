import { HeroSection } from '@/components/home/HeroSection'
import { CategoryStripSection } from '@/components/home/CategoryStripSection'
import { NewDropsSection } from '@/components/home/NewDropsSection'
import { BestsellersSection } from '@/components/home/BestsellersSection'
import { BeautySpotlightSection } from '@/components/home/BeautySpotlightSection'
import { ShopByCategorySection } from '@/components/home/ShopByCategorySection'
import { EditorialSection } from '@/components/home/EditorialSection'
import { LoyaltySection } from '@/components/home/LoyaltySection'
import { DealsSection } from '@/components/home/DealsSection'
import { TrustStripSection } from '@/components/home/TrustStripSection'
import { PromoBannerSection } from '@/components/home/PromoBannerSection'
import { NewsletterSection } from '@/components/home/NewsletterSection'

export default function Home() {
  return (
    <>
      <HeroSection />
      <CategoryStripSection />
      <NewDropsSection />
      <BestsellersSection />
      <BeautySpotlightSection />
      {/* <ShopByCategorySection /> */}
      <EditorialSection />
      <LoyaltySection />
      <DealsSection />
      <TrustStripSection />
      <PromoBannerSection />
      <NewsletterSection />
    </>
  )
}
