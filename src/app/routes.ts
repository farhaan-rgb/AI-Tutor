import { createBrowserRouter } from "react-router";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { RootLayout } from "../layouts/root-layout";
import { AppLayout } from "../layouts/app-layout";
import { FullScreenLayout } from "../layouts/full-screen-layout";


/* Main App Screens */
import { Component as ProfileScreenComponent } from "../screens/profile";


/* Profile Screens */
import { Component as ProfileAnalyticsScreen } from "../screens/profile-analytics";
import { Component as ProfileStubScreen } from "../screens/profile-stub";
import { Component as StudyScheduleScreen } from "../screens/study-schedule";
import { Component as LanguageScreen } from "../screens/language";

/* Learning Path */
import { Component as LearningPathScreen } from "../screens/learning-path";
import { Component as OnboardingDefaultScreen } from "../screens/onboarding-default";
import { Component as OnboardingCatScreen } from "../screens/onboarding-cat";
import { Component as LessonCompleteScreen } from "../screens/lesson-complete";
import { Component as TopicAnalyticsScreen } from "../screens/topic-analytics";

/* Classes */
import { Component as ClassesScreen } from "../screens/classes";
import { Component as ClassesV1Screen } from "../screens/classes-v1";

/* Practice */
import { Component as PracticeScreen } from "../screens/practice";

/* Live Class */
import { Component as LiveClassInterface } from "../screens/live-class";

/* Learning Content Flows */

/* Notifications Demo */
import { Component as NotificationsDemoScreen } from "../screens/notifications-demo";

/* Paywall V2 */
import { Component as PaywallV2Screen } from "../screens/paywall-v2";


/* Course Detail + Curriculum */
import { Component as CourseDetailScreen } from "../screens/course-detail";
import { Component as CourseCurriculumScreen } from "../screens/course-curriculum";
import { Component as AISummerCampScreen } from "../screens/ai-summer-camp-detail";

/* Crash Courses */
import { Component as CrashCourseDetailScreen } from "../screens/crash-course-detail";
import { Component as CrashCourseEnrolledScreen } from "../screens/crash-course-enrolled";
import { Component as CrashCourseSuccessScreen } from "../screens/crash-course-success";
import { Component as OnboardingCrashCourseScreen } from "../screens/onboarding-crash-course";
import { Component as CrashCourseHubScreen } from "../screens/crash-course-hub";

/* AI Tutor — prototype (vision-memo case study, not shipped) */
import { Component as AiTutorHubScreen } from "../screens/ai-tutor-hub";
import { Component as AiTutorChapterHomeScreen } from "../screens/ai-tutor-chapter-home";
import { Component as AiTutorExplainScreen } from "../screens/ai-tutor-explain";
import { Component as AiTutorSolveScreen } from "../screens/ai-tutor-solve";
import { Component as AiTutorGuidedLessonScreen } from "../screens/ai-tutor-guided-lesson";
import { Component as AiTutorCurriculumPreviewScreen } from "../screens/ai-tutor-curriculum-preview";

/* Marketplace */
import { Component as VocabFastDetailScreen } from "../screens/marketplace-vocabfast-detail";
import { Component as VocabFastWebviewScreen } from "../screens/marketplace-vocabfast-webview";
import { Component as MarketplaceHomeScreen } from "../screens/marketplace-home";
import { Component as MarketplaceHomeV1Screen } from "../screens/marketplace-home-v1";
import { Component as MarketplaceV1Screen } from "../screens/marketplace-v1";
import { Component as MarketplaceV2Screen } from "../screens/marketplace-v2";
import { Component as MarketplaceProductScreen } from "../screens/marketplace-product";
import { Component as MarketplaceCartScreen } from "../screens/marketplace-cart";
import { Component as MarketplaceCheckoutScreen } from "../screens/marketplace-checkout";
import { Component as MarketplaceOrderConfirmScreen } from "../screens/marketplace-order-confirm";
import { Component as MarketplaceOrdersScreen } from "../screens/marketplace-orders";
import { Component as MarketplaceOrderDetailScreen } from "../screens/marketplace-order-detail";
import { Component as MarketplaceReturnScreen } from "../screens/marketplace-return";

/* My Test Series — post-purchase library */
import { Component as MyTestSeriesPackScreen } from "../screens/my-test-series-pack";
import { Component as MyTestSeriesMockInstructionsScreen } from "../screens/my-test-series-mock-instructions";
import { Component as MyTestSeriesMockTakeScreen } from "../screens/my-test-series-mock-take";
import { Component as MyTestSeriesMockResultScreen } from "../screens/my-test-series-mock-result";
import { Component as MyTestSeriesMockReviewScreen } from "../screens/my-test-series-mock-review";

/* Olympiads — live-event variant of test series (reuses the take engine) */
import { Component as ArenaHomeScreen } from "../screens/arena-home";
import { Component as ArenaOnboardingScreen } from "../screens/arena-onboarding";
import { Component as ArenaPlayScreen } from "../screens/arena-play";
import { Component as ArenaLevelScreen } from "../screens/arena-level";
import { Component as ArenaLevelResultScreen } from "../screens/arena-level-result";
import { Component as ArenaSpinScreen } from "../screens/arena-spin";
import { Component as ArenaHeartsScreen } from "../screens/arena-hearts";
import { Component as ArenaEventScreen } from "../screens/arena-event";
import { Component as ArenaReviewScreen } from "../screens/arena-review";
import { Component as ArenaTeaserScreen } from "../screens/arena-teaser";
import { Component as ArenaWhatsNextScreen } from "../screens/arena-whats-next";
import { Component as ArenaSquadsScreen } from "../screens/arena-squads";
import { Component as ArenaMasteryScreen } from "../screens/arena-mastery";
import { Component as ArenaResultScreen } from "../screens/arena-result";
import { Component as ArenaRewardsScreen } from "../screens/arena-rewards";
import { Component as ArenaEventsScreen } from "../screens/arena-events";
import { Component as ArenaMyEventsScreen } from "../screens/arena-my-events";
import { Component as OlympiadHomeScreen } from "../screens/olympiad-home";
import { Component as OlympiadRewardsScreen } from "../screens/olympiad-rewards";
import { Component as OlympiadDetailScreen } from "../screens/olympiad-detail";
import { Component as OlympiadRegisterScreen } from "../screens/olympiad-register";
import { Component as OlympiadConfirmedScreen } from "../screens/olympiad-confirmed";
import { Component as OlympiadLobbyScreen } from "../screens/olympiad-lobby";
import { Component as OlympiadSubmittingScreen } from "../screens/olympiad-submitting";
import { Component as OlympiadResultScreen } from "../screens/olympiad-result";
import { Component as OlympiadLeaderboardScreen } from "../screens/olympiad-leaderboard";
import { Component as OlympiadCertificateScreen } from "../screens/olympiad-certificate";
import { Component as OlympiadClaimScreen } from "../screens/olympiad-claim";
import { Component as OlympiadFeedbackScreen } from "../screens/olympiad-feedback";
import { Component as MarketplaceAddressesScreen } from "../screens/marketplace-addresses";
import { Component as MarketplaceAddressFormScreen } from "../screens/marketplace-address-form";
import { Component as MarketplaceWishlistScreen } from "../screens/marketplace-wishlist";
import { Component as MarketplaceCategoryScreen } from "../screens/marketplace-category";
import { Component as MarketplaceSearchScreen } from "../screens/marketplace-search";
import { Component as MarketplaceAppsScreen } from "../screens/marketplace-apps";
import { Component as MarketplaceWebviewScreen } from "../screens/marketplace-webview";
import { Component as MusicCourseDetailScreen } from "../screens/music-course-detail";

/* Post-Enrollment Flow */
import { Component as PaymentSuccessScreen } from "../screens/payment-success";
import { Component as BuildStudyPlanScreen } from "../screens/build-study-plan";
import { Component as StudyPlanCreatingScreen } from "../screens/study-plan-creating";
import { Component as StudyPlanReadyScreen } from "../screens/study-plan-ready";

/* Summer Camp Purchase */
import { Component as SummerCampPurchasedScreen } from "../screens/summer-camp-purchased";

/* Recording Player */
import { Component as RecordingPlayerScreen } from "../screens/recording-player";
import { Component as RecordingV2Screen } from "../screens/recording-v2";

/* Practice Content Flows */
import { Component as PyQsFlow } from "../screens/pyqs-flow";

/* Reviews */
import { Component as ReviewsAllScreen } from "../screens/reviews-all";

/* Referral */
import { Component as ReferAndEarnScreen } from "../screens/refer-and-earn";

/* Games — marketplace */
import { Component as GameDetailScreen } from "../screens/game-detail";
import { Component as GameQuizDuelScreen } from "../screens/game-quiz-duel";
import { Component as GameDailySprintScreen } from "../screens/game-daily-sprint";
import { Component as GameWordWizardScreen } from "../screens/game-word-wizard";
import { Component as GameMathMountainScreen } from "../screens/game-math-mountain";
import { Component as GameScienceLabScreen } from "../screens/game-science-lab";
import { Component as GameLiveArenaScreen } from "../screens/game-live-arena";
import { Component as GameMemoryMatchScreen } from "../screens/game-memory-match";
import { Component as GamePatternPuzzlesScreen } from "../screens/game-pattern-puzzles";
import { Component as GameReadingRaceScreen } from "../screens/game-reading-race";
import { Component as GamesPassCheckoutScreen } from "../screens/games-pass-checkout";
import { Component as CourseCompleteScreen } from "../screens/course-complete";
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
          { path: "onboarding-default", Component: OnboardingDefaultScreen },
          { path: "marketplace", Component: MarketplaceHomeScreen },
          { path: "marketplace-home-v1", Component: MarketplaceHomeV1Screen },
          { path: "marketplace-v1", Component: MarketplaceV1Screen },
          { path: "marketplace-v2", Component: MarketplaceV2Screen },
        ],
      },

      /* Detail Pages - No Bottom Nav */
      { path: "learning-path", Component: LearningPathScreen },
      { path: "learning-path/topic-analytics", Component: TopicAnalyticsScreen },
      { path: "analytics", Component: ProfileAnalyticsScreen },
      { path: "study-schedule", Component: StudyScheduleScreen },
      { path: "language", Component: LanguageScreen },
      { path: "course-complete/:courseId", Component: CourseCompleteScreen },
      { path: "my-certificates", Component: MyCertificatesScreen },
      { path: "profile/:slug", Component: ProfileStubScreen },

      /* Live Class - Completely immersive, no sidebar at any screen size */
      { path: "live-class", Component: LiveClassInterface },

      /* Lesson Screens - FullScreenLayout */
      {
        Component: FullScreenLayout,
        children: [
          { path: "lesson-complete", Component: LessonCompleteScreen },

          /* Learn Content */
          /* Practice Content */
          { path: "practice/pyq", Component: PyQsFlow },

        ],
      },

      /* Notifications Demo */
      { path: "notifications-demo", Component: NotificationsDemoScreen },

      /* Course Detail + Curriculum */
      { path: "course-detail", Component: CourseDetailScreen },
      { path: "course-curriculum", Component: CourseCurriculumScreen },
      { path: "ai-summer-camp", Component: AISummerCampScreen },

      /* Crash Courses */
      { path: "crash-course-detail", Component: CrashCourseDetailScreen },
      { path: "crash-course-enrolled", Component: CrashCourseEnrolledScreen },
      { path: "onboarding-crash-course", Component: OnboardingCrashCourseScreen },
      { path: "crash-course-success", Component: CrashCourseSuccessScreen },
      { path: "crash-course-hub", Component: CrashCourseHubScreen },

      /* AI Tutor — prototype (vision-memo case study, not shipped) */
      { path: "ai-tutor", Component: AiTutorHubScreen },
      { path: "ai-tutor/chapter-home", Component: AiTutorChapterHomeScreen },
      { path: "ai-tutor/explain", Component: AiTutorExplainScreen },
      { path: "ai-tutor/solve", Component: AiTutorSolveScreen },
      { path: "ai-tutor/guided-lesson", Component: AiTutorGuidedLessonScreen },
      { path: "ai-tutor/curriculum-preview", Component: AiTutorCurriculumPreviewScreen },

      /* Marketplace Detail Pages (no bottom nav) */
      { path: "marketplace/product/:id/reviews", Component: ReviewsAllScreen },
      { path: "marketplace/product/:id", Component: MarketplaceProductScreen },
      { path: "marketplace/cart", Component: MarketplaceCartScreen },
      { path: "marketplace/checkout", Component: MarketplaceCheckoutScreen },
      { path: "marketplace/order-confirm", Component: MarketplaceOrderConfirmScreen },
      { path: "marketplace/orders", Component: MarketplaceOrdersScreen },
      { path: "marketplace/order-detail", Component: MarketplaceOrderDetailScreen },
      { path: "marketplace/return", Component: MarketplaceReturnScreen },

      /* My Test Series — student's library after buying mock packs */
      { path: "my-test-series/:packId", Component: MyTestSeriesPackScreen },
      { path: "my-test-series/:packId/mock/:mockId/instructions", Component: MyTestSeriesMockInstructionsScreen },
      { path: "my-test-series/:packId/mock/:mockId/take", Component: MyTestSeriesMockTakeScreen },
      { path: "my-test-series/:packId/mock/:mockId/result", Component: MyTestSeriesMockResultScreen },
      { path: "my-test-series/:packId/mock/:mockId/review", Component: MyTestSeriesMockReviewScreen },

      /* Olympiads — discovery → register → lobby → (reused take engine) → submitting → result (analytics now inline) → leaderboard / certificate / feedback */
      /* Arena — competitive hub (Leagues). Championships reuse the olympiad routes below. */
      { path: "arena", Component: ArenaHomeScreen },
      { path: "arena/onboarding", Component: ArenaOnboardingScreen },
      { path: "arena/play", Component: ArenaPlayScreen },
      { path: "arena/level", Component: ArenaLevelScreen },
      { path: "arena/level-result", Component: ArenaLevelResultScreen },
      { path: "arena/spin", Component: ArenaSpinScreen },
      { path: "arena/hearts", Component: ArenaHeartsScreen },
      { path: "arena/event", Component: ArenaEventScreen },
      { path: "arena/events", Component: ArenaEventsScreen },
      { path: "arena/my-events", Component: ArenaMyEventsScreen },
      { path: "arena/result", Component: ArenaResultScreen },
      { path: "arena/review", Component: ArenaReviewScreen },
      { path: "arena/teaser", Component: ArenaTeaserScreen },
      { path: "arena/whats-next", Component: ArenaWhatsNextScreen },
      { path: "arena/squads", Component: ArenaSquadsScreen },
      { path: "arena/mastery", Component: ArenaMasteryScreen },
      { path: "arena/rewards", Component: ArenaRewardsScreen },
      { path: "olympiad", Component: OlympiadHomeScreen },
      { path: "olympiad/rewards", Component: OlympiadRewardsScreen },
      { path: "olympiad/:olympiadId", Component: OlympiadDetailScreen },
      { path: "olympiad/:olympiadId/register", Component: OlympiadRegisterScreen },
      { path: "olympiad/:olympiadId/confirmed", Component: OlympiadConfirmedScreen },
      { path: "olympiad/:olympiadId/lobby", Component: OlympiadLobbyScreen },
      { path: "olympiad/:olympiadId/submitting", Component: OlympiadSubmittingScreen },
      { path: "olympiad/:olympiadId/result", Component: OlympiadResultScreen },
      { path: "olympiad/:olympiadId/leaderboard", Component: OlympiadLeaderboardScreen },
      { path: "olympiad/:olympiadId/certificate", Component: OlympiadCertificateScreen },
      { path: "olympiad/:olympiadId/claim", Component: OlympiadClaimScreen },
      { path: "olympiad/:olympiadId/feedback", Component: OlympiadFeedbackScreen },
      { path: "marketplace/addresses", Component: MarketplaceAddressesScreen },
      { path: "marketplace/addresses/new", Component: MarketplaceAddressFormScreen },
      { path: "marketplace/addresses/:id/edit", Component: MarketplaceAddressFormScreen },
      { path: "marketplace/wishlist", Component: MarketplaceWishlistScreen },

      /* VocabularyFast — partner integration (specific routes before parametric) */
      { path: "marketplace/vocab/:packId", Component: VocabFastDetailScreen },
      { path: "marketplace/webview/vf-:packSuffix", Component: VocabFastWebviewScreen },

      { path: "marketplace/category/:id", Component: MarketplaceCategoryScreen },
      { path: "marketplace/search", Component: MarketplaceSearchScreen },
      { path: "marketplace/apps", Component: MarketplaceAppsScreen },
      { path: "marketplace/webview/:appId", Component: MarketplaceWebviewScreen },
      { path: "marketplace/music/:courseId", Component: MusicCourseDetailScreen },

      /* Games — Pass checkout + detail + playable flagships (specific before parametric) */
      { path: "marketplace/games-pass",             Component: GamesPassCheckoutScreen },
      { path: "marketplace/game/quiz-duel/play",    Component: GameQuizDuelScreen },
      { path: "marketplace/game/daily-sprint/play", Component: GameDailySprintScreen },
      { path: "marketplace/game/word-wars/play",    Component: GameWordWizardScreen },
      { path: "marketplace/game/brain-sprint/play", Component: GameMathMountainScreen },
      { path: "marketplace/game/concept-labs/play", Component: GameScienceLabScreen },
      { path: "marketplace/game/live-quiz-arena/play", Component: GameLiveArenaScreen },
      { path: "marketplace/game/memory-match/play", Component: GameMemoryMatchScreen },
      { path: "marketplace/game/pattern-puzzles/play", Component: GamePatternPuzzlesScreen },
      { path: "marketplace/game/reading-race/play", Component: GameReadingRaceScreen },
      { path: "marketplace/game/:id",               Component: GameDetailScreen },

      /* Paywall V2 */
      { path: "paywall-v2", Component: PaywallV2Screen },


      /* Post-Enrollment Flow */
      { path: "summer-camp-purchased", Component: SummerCampPurchasedScreen },
      { path: "payment-success", Component: PaymentSuccessScreen },
      { path: "build-study-plan", Component: BuildStudyPlanScreen },
      { path: "onboarding-cat", Component: OnboardingCatScreen },
      { path: "study-plan-creating", Component: StudyPlanCreatingScreen },
      { path: "study-plan-ready", Component: StudyPlanReadyScreen },

      /* Refer & Earn */
      { path: "refer-and-earn", Component: ReferAndEarnScreen },

      /* Recording Player */
      { path: "recording", Component: RecordingPlayerScreen },
      { path: "recording-v2", Component: RecordingV2Screen },

      /* Fallback */
      { path: "*", Component: LearningPathScreen },
    ],
  },
]);
