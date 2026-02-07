import { LayoutDashboard } from "lucide-react";

const Dashboard = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <LayoutDashboard className="h-6 w-6 text-primary" />
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
    </div>
    <p className="text-muted-foreground">Em construção</p>
  </div>
);

export default Dashboard;
