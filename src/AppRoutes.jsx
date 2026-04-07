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

function BlogRoute() {
  const pageProps = usePageRouteProps();
  return <BlogIndex {...pageProps} />;
}

function BlogPostRoute() {
  const pageProps = usePageRouteProps();
  return <BlogPostPage {...pageProps} />;
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
      <Route path="/blog" element={<BlogRoute />} />
      <Route path="/blog/:slug" element={<BlogPostRoute />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
