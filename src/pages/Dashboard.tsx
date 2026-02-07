import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("top_user");
    if (!user) navigate("/", { replace: true });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("top_user");
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <h1 className="text-2xl font-bold text-foreground">Dashboard em construção</h1>
      <button
        onClick={handleLogout}
        className="rounded-lg bg-[#E8731A] px-6 py-2 font-semibold text-white hover:bg-[#c96115]"
      >
        Sair
      </button>
    </div>
  );
};

export default Dashboard;
