import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import About from "@/pages/About";
import Blog from "@/pages/Blog";
import PostDetail from "@/pages/PostDetail";
import Contact from "@/pages/Contact";

// Admin Pages
import AdminDashboard from "@/pages/Admin/Dashboard";
import AdminPosts from "@/pages/Admin/Posts";
import AdminComments from "@/pages/Admin/Comments";
import AdminHero from "@/pages/Admin/Hero";
import AdminTestimonials from "@/pages/Admin/Testimonials";
import AdminSettings from "@/pages/Admin/Settings";
import AdminChat from "@/pages/Admin/Chat";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/about" component={About} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={PostDetail} />
      <Route path="/contact" component={Contact} />

      {/* Admin Routes */}
      <Route path="/admin">
        <ProtectedRoute component={AdminDashboard} adminOnly />
      </Route>
      <Route path="/admin/posts">
        <ProtectedRoute component={AdminPosts} adminOnly />
      </Route>
      <Route path="/admin/comments">
        <ProtectedRoute component={AdminComments} adminOnly />
      </Route>
      <Route path="/admin/hero">
        <ProtectedRoute component={AdminHero} adminOnly />
      </Route>
      <Route path="/admin/testimonials">
        <ProtectedRoute component={AdminTestimonials} adminOnly />
      </Route>
      <Route path="/admin/settings">
        <ProtectedRoute component={AdminSettings} adminOnly />
      </Route>
      <Route path="/admin/chat">
        <ProtectedRoute component={AdminChat} adminOnly />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

import { SiteConfigProvider } from "@/components/SiteConfigProvider";
import { ChatWidget } from "@/components/ChatWidget";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SiteConfigProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <ChatWidget />
          </TooltipProvider>
        </AuthProvider>
      </SiteConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
