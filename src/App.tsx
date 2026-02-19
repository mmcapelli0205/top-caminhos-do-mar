import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Participantes from "./pages/Participantes";
import Servidores from "./pages/Servidores";
import ServidorForm from "./pages/ServidorForm";
import Financeiro from "./pages/Financeiro";
import Equipamentos from "./pages/Equipamentos";
import ArtesEDocs from "./pages/ArtesEDocs";
import CheckIn from "./pages/CheckIn";
import Configuracoes from "./pages/Configuracoes";
import Tops from "./pages/Tops";
import TopRealTime from "./pages/TopRealTime";
import ParticipanteForm from "./pages/ParticipanteForm";
import AreaPortal from "./pages/AreaPortal";
import Aprovacoes from "./pages/Aprovacoes";
import PrimeiroAcesso from "./pages/PrimeiroAcesso";
import NotFound from "./pages/NotFound";
import KmzMapa from "./pages/KmzMapa";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: true,
    },
  },
});

const App = () => {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      console.error("Unhandled rejection:", event.reason);
      event.preventDefault();
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/primeiro-acesso" element={<PrimeiroAcesso />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/participantes" element={<Participantes />} />
              <Route path="/participantes/novo" element={<ParticipanteForm />} />
              <Route path="/participantes/:id/editar" element={<ParticipanteForm />} />
              <Route path="/servidores" element={<Servidores />} />
              <Route path="/servidores/novo" element={<ServidorForm />} />
              <Route path="/servidores/:id/editar" element={<ServidorForm />} />
              <Route path="/financeiro" element={<Financeiro />} />
              <Route path="/equipamentos" element={<Equipamentos />} />
              <Route path="/artes-docs" element={<ArtesEDocs />} />
              <Route path="/check-in" element={<CheckIn />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/tops" element={<Tops />} />
              <Route path="/top-real-time" element={<TopRealTime />} />
              <Route path="/aprovacoes" element={<Aprovacoes />} />
              <Route path="/areas/:nome" element={<AreaPortal />} />
              <Route path="/kmz" element={<KmzMapa />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
