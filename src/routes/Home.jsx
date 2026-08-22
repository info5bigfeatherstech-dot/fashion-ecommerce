import { HeroSection } from '@/components/home/HeroSection'
import { CircularCategoriesSection } from '@/components/home/CircularCategoriesSection'
import { CategoryStripSection } from '@/components/home/CategoryStripSection'
import { NewArrivalsSection } from '@/components/home/NewArrivalsSection'
import { LatestCollectionsSection } from '@/components/home/LatestCollectionsSection'
import { NewDropsSection } from '@/components/home/NewDropsSection'
import { TheArchiveSection } from '@/components/home/TheArchiveSection'
import { BestsellersSection } from '@/components/home/BestsellersSection'
import { MostLovedSection } from '@/components/home/MostLovedSection'
import { TrendingNowFastSection } from '@/components/home/TrendingNowFastSection'
import { BeautySpotlightSection } from '@/components/home/BeautySpotlightSection'
import { ShopByCategorySection } from '@/components/home/ShopByCategorySection'
import { EditorialSection } from '@/components/home/EditorialSection'
import { AsSeenOnYouSection } from '@/components/home/AsSeenOnYouSection'
import { JewelleryFestSection } from '@/components/home/JewelleryFestSection'
import { DealsSection } from '@/components/home/DealsSection'
import { TrustStripSection } from '@/components/home/TrustStripSection'
import { PromoBannerSection } from '@/components/home/PromoBannerSection'
import { SignatureJewelrySection } from '@/components/home/SignatureJewelrySection'
import { CraftsmanshipSection } from '@/components/home/CraftsmanshipSection'
import { NewsletterSection } from '@/components/home/NewsletterSection'

export default function Home() {
  return (
    <>
      <HeroSection />
      <CircularCategoriesSection />
      <JewelleryFestSection />
      <SignatureJewelrySection />
      <CraftsmanshipSection />
      <TheArchiveSection />
      <NewArrivalsSection />
      <TrendingNowFastSection />
      <AsSeenOnYouSection />
      {/* <CategoryStripSection /> */}
      {/* <LatestCollectionsSection /> */}
      {/* <NewDropsSection /> */}
      <BestsellersSection />
      {/* <MostLovedSection /> */}
      {/* <BeautySpotlightSection /> */}
      {/* <ShopByCategorySection /> */}
      {/* <EditorialSection /> */}
      {/* <DealsSection /> */}
      {/* <TrustStripSection /> */}
      {/* <PromoBannerSection /> */}
      <NewsletterSection />
    </>
  )
}
