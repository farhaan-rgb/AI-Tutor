import { createBrowserRouter } from "react-router";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { RootLayout } from "../layouts/root-layout";
import { AppLayout } from "../layouts/app-layout";

/* Main App Screens */
import { Component as ProfileScreenComponent } from "../screens/profile";

/* Profile Screens */
import { Component as ProfileAnalyticsScreen } from "../screens/profile-analytics";
import { Component as ProfileStubScreen } from "../screens/profile-stub";
import { Component as StudyScheduleScreen } from "../screens/study-schedule";
import { Component as LanguageScreen } from "../screens/language";

/* Classes */
import { Component as ClassesScreen } from "../screens/classes";
import { Component as ClassesV1Screen } from "../screens/classes-v1";

/* Practice */
import { Component as PracticeScreen } from "../screens/practice";

/* Paywall V2 */
import { Component as PaywallV2Screen } from "../screens/paywall-v2";

/* Crash Courses */
import { Component as CrashCourseDetailScreen } from "../screens/crash-course-detail";
import { Component as CrashCourseEnrolledScreen } from "../screens/crash-course-enrolled";
import { Component as CrashCourseSuccessScreen } from "../screens/crash-course-success";
import { Component as OnboardingCrashCourseScreen } from "../screens/onboarding-crash-course";

/* AI Tutor — prototype (vision-memo case study, not shipped) */
import { Component as AiTutorHubScreen } from "../screens/ai-tutor-hub";
import { Component as AiTutorChapterHomeScreen } from "../screens/ai-tutor-chapter-home";
import { Component as AiTutorExplainScreen } from "../screens/ai-tutor-explain";
import { Component as AiTutorSolveScreen } from "../screens/ai-tutor-solve";
import { Component as AiTutorGuidedLessonScreen } from "../screens/ai-tutor-guided-lesson";
import { Component as AiTutorCurriculumPreviewScreen } from "../screens/ai-tutor-curriculum-preview";

/* Marketplace */
import { Component as MarketplaceV1Screen } from "../screens/marketplace-v1";
import { Component as MarketplaceAddressesScreen } from "../screens/marketplace-addresses";
import { Component as MarketplaceAddressFormScreen } from "../screens/marketplace-address-form";
import { Component as MarketplaceOrdersScreen } from "../screens/marketplace-orders";
import { Component as MarketplaceOrderDetailScreen } from "../screens/marketplace-order-detail";
import { Component as MarketplaceWishlistScreen } from "../screens/marketplace-wishlist";

/* Post-Enrollment / Profile ecosystem */
import { Component as ReferAndEarnScreen } from "../screens/refer-and-earn";
import { Component as MyCertificatesScreen } from "../screens/my-certificates";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      /* Redirect to Classes V1 by default */
      {
        index: true,
        Component: () => {
          const navigate = useNavigate();
          useEffect(() => {
            navigate('/classes-v1', { replace: true });
          }, [navigate]);
          return null;
        }
      },

      /* Main App - 3 Bottom Nav Tabs */
      {
        Component: AppLayout,
        children: [
          { path: "classes", Component: ClassesScreen },
          { path: "classes-v1", Component: ClassesV1Screen },
          { path: "practice", Component: PracticeScreen },
          { path: "profile", Component: ProfileScreenComponent },
          { path: "marketplace-v1", Component: MarketplaceV1Screen },
        ],
      },

      /* Detail Pages - No Bottom Nav */
      { path: "analytics", Component: ProfileAnalyticsScreen },
      { path: "study-schedule", Component: StudyScheduleScreen },
      { path: "language", Component: LanguageScreen },
      { path: "my-certificates", Component: MyCertificatesScreen },
      { path: "profile/:slug", Component: ProfileStubScreen },

      /* Crash Courses */
      { path: "crash-course-detail", Component: CrashCourseDetailScreen },
      { path: "crash-course-enrolled", Component: CrashCourseEnrolledScreen },
      { path: "onboarding-crash-course", Component: OnboardingCrashCourseScreen },
      { path: "crash-course-success", Component: CrashCourseSuccessScreen },

      /* AI Tutor — prototype (vision-memo case study, not shipped) */
      { path: "ai-tutor", Component: AiTutorHubScreen },
      { path: "ai-tutor/chapter-home", Component: AiTutorChapterHomeScreen },
      { path: "ai-tutor/explain", Component: AiTutorExplainScreen },
      { path: "ai-tutor/solve", Component: AiTutorSolveScreen },
      { path: "ai-tutor/guided-lesson", Component: AiTutorGuidedLessonScreen },
      { path: "ai-tutor/curriculum-preview", Component: AiTutorCurriculumPreviewScreen },

      /* Marketplace Detail Pages (no bottom nav) */
      { path: "marketplace/orders", Component: MarketplaceOrdersScreen },
      { path: "marketplace/order-detail", Component: MarketplaceOrderDetailScreen },
      { path: "marketplace/addresses", Component: MarketplaceAddressesScreen },
      { path: "marketplace/addresses/new", Component: MarketplaceAddressFormScreen },
      { path: "marketplace/addresses/:id/edit", Component: MarketplaceAddressFormScreen },
      { path: "marketplace/wishlist", Component: MarketplaceWishlistScreen },

      /* Paywall V2 */
      { path: "paywall-v2", Component: PaywallV2Screen },

      /* Refer & Earn */
      { path: "refer-and-earn", Component: ReferAndEarnScreen },

      /* Fallback */
      {
        path: "*",
        Component: () => (
          <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)" }}>
            Page not found
          </div>
        ),
      },
    ],
  },
]);
