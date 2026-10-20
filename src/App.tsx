import { SiteLayout } from "./components/site/SiteLayout";
import { AccountPage } from "./pages/AccountPage";
import { HomePage } from "./pages/HomePage";
import { LabPage } from "./pages/LabPage";
import { LearnPage } from "./pages/LearnPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProgressPage } from "./pages/ProgressPage";
import { useHashRoute, type Route } from "./routing/useHashRoute";

function pageFor(route: Route) {
  switch (route) {
    case "home":
      return <HomePage />;
    case "lab":
      return <LabPage />;
    case "aprender":
      return <LearnPage />;
    case "progresso":
      return <ProgressPage />;
    case "conta":
      return <AccountPage />;
    case "praticar":
      // Rota reservada, ainda sem página: avisa em vez de cair na Home.
      return <NotFoundPage soon />;
    case "naoencontrada":
      return <NotFoundPage />;
  }
}

export default function App() {
  const route = useHashRoute();
  return <SiteLayout route={route}>{pageFor(route)}</SiteLayout>;
}
