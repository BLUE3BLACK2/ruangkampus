import PublicLayout from "@/components/public/PublicLayout";
import HeroSection from "@/components/public/HeroSection";
import DemandIndicator from "@/components/public/DemandIndicator";
import FeaturedRooms from "@/components/public/FeaturedRooms";
import HowItWorks from "@/components/public/HowItWorks";

export default function Home() {
  return (
    <PublicLayout>
      <HeroSection />
      <DemandIndicator />
      <FeaturedRooms />
      <HowItWorks />
    </PublicLayout>
  );
}