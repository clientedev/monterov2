import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { ThemeInjector } from "@/components/ThemeInjector";
import { PinkOctoberBadge } from "@/components/PinkOctoberBadge";
import { ChatBubble } from "@/components/ChatBubble";
import { ScrollToTop } from "@/components/ScrollToTop";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Sobre from "@/pages/Sobre";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/PostDetail";
import Contact from "@/pages/Contact";
import PublicServicesPage from "@/pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import CustomerDashboard from "./pages/CustomerDashboard";
import ProfilePage from "./pages/Profile";
import CreatePasswordPage from "./pages/CreatePassword";

import AdminLayout from "@/pages/admin-crm/layout";

// Admin CRM Pages (Code-split to ensure public mobile site loads instantly)
const ContactsPage = lazy(() => import("@/pages/admin-crm/contacts"));
const LeadsPage = lazy(() => import("@/pages/admin-crm/leads"));
const InteractionsPage = lazy(() => import("@/pages/admin-crm/interactions"));
const PostsPage = lazy(() => import("@/pages/admin-crm/posts"));
const CommentsPage = lazy(() => import("@/pages/admin-crm/comments"));
const ServicesPage = lazy(() => import("@/pages/admin-crm/services"));
const AnalyticsPage = lazy(() => import("@/pages/admin-crm/marketing/analytics"));
const CampaignsPage = lazy(() => import("@/pages/admin-crm/marketing/campaigns"));
const UsersPage = lazy(() => import("@/pages/admin-crm/users"));
const TasksPage = lazy(() => import("@/pages/admin-crm/tasks"));
const AdminDashboard = lazy(() => import("@/pages/admin-crm/dashboard"));
const SiteConfigPage = lazy(() => import("@/pages/admin-crm/site-config"));
const ReviewsPage = lazy(() => import("@/pages/admin-crm/reviews"));
const ProspectingPage = lazy(() => import("@/pages/admin-crm/prospecting"));
const CompanySearchPage = lazy(() => import("@/pages/admin-crm/company-search"));
const TodoistModulePage = lazy(() => import("@/pages/admin-crm/todoist"));
const NotasPage = lazy(() => import("@/pages/admin-crm/notas"));

// Insurance Module Pages (Code-split)
const DashboardSegurosPage = lazy(() => import("@/pages/admin-crm/dashboard-seguros"));
const ClientesPage = lazy(() => import("@/pages/admin-crm/clientes"));
const ClienteDetalhePage = lazy(() => import("@/pages/admin-crm/cliente-detalhe"));
const ApolicesPage = lazy(() => import("@/pages/admin-crm/apolices"));

function ProtectedAdminRoute({ path, component: Component }: { path: string; component: React.ComponentType<any> }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "employee")) {
    return <Route path={path} component={Login} />;
  }

  return (
    <Route path={path}>
      <AdminLayout>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[350px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }>
          <Component />
        </Suspense>
      </AdminLayout>
    </Route>
  );
}

function ProtectedClientRoute({ path, component: Component }: { path: string; component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Route path={path} component={Login} />;
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}

import ExternalRegisterContactModal from "@/pages/ExternalRegisterContactModal";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/sobre" component={Sobre} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/services" component={PublicServicesPage} />
      <Route path="/services/:id" component={ServiceDetail} />
      <Route path="/contact" component={Contact} />
      <Route path="/criar-senha" component={CreatePasswordPage} />
      <Route path="/embed/register-contact" component={ExternalRegisterContactModal} />

      {/* Customer Area */}
      <ProtectedClientRoute path="/dashboard" component={CustomerDashboard} />
      <ProtectedClientRoute path="/profile" component={ProfilePage} />

      {/* Admin CRM Routes */}
      <ProtectedAdminRoute path="/admin" component={AdminDashboard} />
      <ProtectedAdminRoute path="/admin/contacts" component={ContactsPage} />
      <ProtectedAdminRoute path="/admin/leads" component={LeadsPage} />
      <ProtectedAdminRoute path="/admin/interactions" component={InteractionsPage} />
      <ProtectedAdminRoute path="/admin/posts" component={PostsPage} />
      <ProtectedAdminRoute path="/admin/comments" component={CommentsPage} />
      <ProtectedAdminRoute path="/admin/services" component={ServicesPage} />
      <ProtectedAdminRoute path="/admin/marketing/results" component={AnalyticsPage} />
      <ProtectedAdminRoute path="/admin/marketing/campaigns" component={CampaignsPage} />
      <ProtectedAdminRoute path="/admin/users" component={UsersPage} />
      <ProtectedAdminRoute path="/admin/tasks" component={TasksPage} />
      <ProtectedAdminRoute path="/admin/site-config" component={SiteConfigPage} />
      <ProtectedAdminRoute path="/admin/integracoes" component={SiteConfigPage} />
      <ProtectedAdminRoute path="/admin/api-keys" component={SiteConfigPage} />
      <ProtectedAdminRoute path="/admin/reviews" component={ReviewsPage} />
      <ProtectedAdminRoute path="/admin/prospecting" component={ProspectingPage} />
      <ProtectedAdminRoute path="/admin/company-search" component={CompanySearchPage} />
      <ProtectedAdminRoute path="/admin/todoist" component={TodoistModulePage} />
      <ProtectedAdminRoute path="/admin/notas" component={NotasPage} />

      {/* Insurance Module Routes */}
      <ProtectedAdminRoute path="/admin/seguros" component={DashboardSegurosPage} />
      <ProtectedAdminRoute path="/admin/clientes" component={ClientesPage} />
      <ProtectedAdminRoute path="/admin/clientes/:id" component={ClienteDetalhePage} />
      <ProtectedAdminRoute path="/admin/apolices" component={ApolicesPage} />
      

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <ThemeInjector />
          <ScrollToTop />
          <Router />
          <PinkOctoberBadge />
          <ChatBubble />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
