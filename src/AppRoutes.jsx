import { Route, Routes, useNavigate } from "react-router-dom";

import About from "./pages/About";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";
import PricingInfo from "./pages/PricingInfo";
import PrivacyPage from "./pages/PrivacyPage";
import RefundPage from "./pages/RefundPage";
import Subscribe from "./pages/Subscribe";
import Success from "./pages/Success";
import TermsPage from "./pages/TermsPage";
import AdminDashboard from "./pages/AdminDashboard";

import { usePageRouteProps } from "./hooks/usePageRouteProps";
import { useMe } from "./hooks/useMe";
import { useToast } from "./hooks/useToast";
import Landing from "./pages/Landing";
import BlogIndex from "./pages/BlogIndex";
import BlogPostPage from "./pages/BlogPostPage";
import Brochure from "./pages/Brochure";
import CampaignLandingPage from "./pages/CampaignLandingPage";
import Welcome from "./pages/Welcome";

function PricingRoute() {
  const pageProps = usePageRouteProps();
  return <Pricing {...pageProps} />;
}

function SubscribeRoute() {
  const pageProps = usePageRouteProps();
  return <Subscribe {...pageProps} />;
}

function SuccessRoute() {
  const pageProps = usePageRouteProps();
  return <Success {...pageProps} />;
}

function TermsRoute() {
  const pageProps = usePageRouteProps();
  return <TermsPage {...pageProps} />;
}

function PrivacyRoute() {
  const pageProps = usePageRouteProps();
  return <PrivacyPage {...pageProps} />;
}

function RefundRoute() {
  const pageProps = usePageRouteProps();
  return <RefundPage {...pageProps} />;
}

function PricingInfoRoute() {
  const pageProps = usePageRouteProps();
  const navigate = useNavigate();
  const { me } = useMe();
  const { pushToast } = useToast();

  const { t } = pageProps;

  const startCheckout = async () => {
    if (!me?.user) {
      pushToast({
        type: "info",
        title: t("loginRequired"),
        message: t("pleaseLoginToContinue"),
      });
      navigate("/?upgrade=1");
      return;
    }

    if (me?.entitlements?.pro) {
      pushToast({
        type: "success",
        title: t("proActive"),
        message: t("alreadyPro"),
      });
      return;
    }

    navigate(`/pricing?email=${encodeURIComponent(me?.user?.email || "")}`);
  };

  return <PricingInfo {...pageProps} onUpgrade={startCheckout} />;
}

function LandingRoute() {
  const pageProps = usePageRouteProps();
  return <Landing {...pageProps} />;
}

const CAMPAIGN_CONFIGS = {
  avoidBadWeather: {
    headlineKey: "campaignAvoidBadWeatherHeadline",
    subheadlineKey: "campaignAvoidBadWeatherSubheadline",
    ctaKey: "campaignAvoidBadWeatherCta",
    metaTitle: "Avoid Bad Camping Weather in Iceland | Eltum Veðrið",
    metaDescription:
      "Compare nearby Iceland campsites and find calmer, drier camping conditions before you settle in.",
    canonicalPath: "/avoid-bad-weather",
  },
  caravanWeather: {
    headlineKey: "campaignCaravanWeatherHeadline",
    subheadlineKey: "campaignCaravanWeatherSubheadline",
    ctaKey: "campaignCaravanWeatherCta",
    metaTitle: "Caravan Weather Planning in Iceland | Eltum Veðrið",
    metaDescription:
      "Check wind, gusts, rain, and nearby campsite options before towing or parking your caravan in Iceland.",
    canonicalPath: "/caravan-weather",
  },
  campingWind: {
    headlineKey: "campaignCampingWindHeadline",
    subheadlineKey: "campaignCampingWindSubheadline",
    ctaKey: "campaignCampingWindCta",
    metaTitle: "Camping Wind Forecasts in Iceland | Eltum Veðrið",
    metaDescription:
      "Compare wind and gust conditions across nearby Iceland campsites before choosing where to stay.",
    canonicalPath: "/camping-wind",
  },
  weekendCamping: {
    headlineKey: "campaignWeekendCampingHeadline",
    subheadlineKey: "campaignWeekendCampingSubheadline",
    ctaKey: "campaignWeekendCampingCta",
    metaTitle: "Weekend Camping Weather in Iceland | Eltum Veðrið",
    metaDescription:
      "Plan a better weekend camping trip in Iceland by comparing nearby campsite weather conditions.",
    canonicalPath: "/weekend-camping",
  },
};

function CampaignRoute({ configKey }) {
  const { t, lang, theme } = usePageRouteProps();
  const config = CAMPAIGN_CONFIGS[configKey];
  return <CampaignLandingPage t={t} lang={lang} theme={theme} {...config} />;
}

function WelcomeRoute() {
  const pageProps = usePageRouteProps();
  return <Welcome {...pageProps} />;
}

function BlogRoute({ langOverride }) {
  const pageProps = usePageRouteProps();
  return <BlogIndex {...pageProps} lang={langOverride || pageProps.lang} />;
}

function BlogPostRoute({ langOverride }) {
  const pageProps = usePageRouteProps();
  return <BlogPostPage {...pageProps} lang={langOverride || pageProps.lang} />;
}

export default function AppRoutes({ HomeComponent }) {
  return (
    <Routes>
      <Route path="/" element={<HomeComponent />} />
      <Route path="/about" element={<HomeComponent page="about" />} />
      <Route path="/pricing" element={<PricingRoute />} />
      <Route path="/pricing-info" element={<PricingInfoRoute />} />
      <Route path="/subscribe" element={<SubscribeRoute />} />
      <Route path="/success" element={<SuccessRoute />} />
      <Route path="/terms" element={<TermsRoute />} />
      <Route path="/privacy" element={<PrivacyRoute />} />
      <Route path="/refund" element={<RefundRoute />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/iceland-camping-weather" element={<LandingRoute />} />
      <Route path="/avoid-bad-weather" element={<CampaignRoute configKey="avoidBadWeather" />} />
      <Route path="/caravan-weather" element={<CampaignRoute configKey="caravanWeather" />} />
      <Route path="/camping-wind" element={<CampaignRoute configKey="campingWind" />} />
      <Route path="/weekend-camping" element={<CampaignRoute configKey="weekendCamping" />} />
      <Route path="/blog" element={<BlogRoute />} />
      <Route path="/blog/:slug" element={<BlogPostRoute />} />
      <Route path="/en/blog" element={<BlogRoute langOverride="en" />} />
      <Route path="/en/blog/:slug" element={<BlogPostRoute langOverride="en" />} />
      <Route path="/brochure" element={<Brochure />} />
      <Route path="/welcome" element={<WelcomeRoute />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
