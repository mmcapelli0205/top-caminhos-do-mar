import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAreaServico } from "@/hooks/useAreaServico";

export default function FinanceiroRedirect() {
  const { role } = useAuth();
  const { areaServico } = useAreaServico();

  if (role === "diretoria") {
    return <Navigate to="/areas/Diretoria" replace />;
  }
  if (areaServico === "ADM") {
    return <Navigate to="/areas/ADM" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}
