import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { ThemeInjector } from "@/components/ThemeInjector";
import { ChatBubble } from "@/components/ChatBubble";
import { ScrollToTop } from "@/components/ScrollToTop";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import About from "@/pages/About";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/PostDetail";
import Contact from "@/pages/Contact";
import PublicServicesPage from "@/pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import CustomerDashboard from "./pages/CustomerDashboard";
import ProfilePage from "./pages/Profile";

// Admin CRM Pages
import ContactsPage from "@/pages/admin-crm/contacts";
import LeadsPage from "@/pages/admin-crm/leads";
import InteractionsPage from "@/pages/admin-crm/interactions";
import PostsPage from "@/pages/admin-crm/posts";
import CommentsPage from "@/pages/admin-crm/comments";
import ServicesPage from "@/pages/admin-crm/services";
import AnalyticsPage from "@/pages/admin-crm/marketing/analytics";
import CampaignsPage from "@/pages/admin-crm/marketing/campaigns";
import UsersPage from "@/pages/admin-crm/users";
import TasksPage from "@/pages/admin-crm/tasks";
import AdminDashboard from "@/pages/admin-crm/dashboard";
import AdminLayout from "@/pages/admin-crm/layout";
import SiteConfigPage from "@/pages/admin-crm/site-config";
import ReviewsPage from "@/pages/admin-crm/reviews";
import ProspectingPage from "@/pages/admin-crm/prospecting";
import CompanySearchPage from "@/pages/admin-crm/company-search";
import ProductsPage from "@/pages/admin-crm/products";

function ProtectedAdminRoute({ path, component: Component }: { path: string; component: React.ComponentType }) {
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
        <Component />
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/about" component={About} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/services" component={PublicServicesPage} />
      <Route path="/services/:id" component={ServiceDetail} />
      <Route path="/contact" component={Contact} />

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
      <ProtectedAdminRoute path="/admin/reviews" component={ReviewsPage} />
      <ProtectedAdminRoute path="/admin/prospecting" component={ProspectingPage} />
      <ProtectedAdminRoute path="/admin/company-search" component={CompanySearchPage} />
      <ProtectedAdminRoute path="/admin/products" component={ProductsPage} />

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
          <ChatBubble />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
