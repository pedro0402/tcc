import { SiteLayout } from "./components/site/SiteLayout";
import { AccountPage } from "./pages/AccountPage";
import { HomePage } from "./pages/HomePage";
import { LabPage } from "./pages/LabPage";
import { LearnPage } from "./pages/LearnPage";
import { ProgressPage } from "./pages/ProgressPage";
import { useHashRoute } from "./routing/useHashRoute";

export default function App() {
  const route = useHashRoute();

  const page =
    route === "lab" ? (
      <LabPage />
    ) : route === "aprender" ? (
      <LearnPage />
    ) : route === "progresso" ? (
      <ProgressPage />
    ) : route === "conta" ? (
      <AccountPage />
    ) : (
      <HomePage />
    );

  return <SiteLayout route={route}>{page}</SiteLayout>;
}
