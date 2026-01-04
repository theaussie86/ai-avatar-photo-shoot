import { CreatorLayout } from "@/components/avatar-creator/CreatorLayout";
import { ConfigurationPanel } from "@/components/avatar-creator/ConfigurationPanel";
import { ImageGallery } from "@/components/avatar-creator/ImageGallery";

export default function Home() {
  return (
    <CreatorLayout>
      <div className="space-y-6">
        <ConfigurationPanel />
      </div>
      <div className="space-y-6">
         <ImageGallery />
      </div>
    </CreatorLayout>
  );
}
