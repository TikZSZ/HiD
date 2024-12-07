
// import { KeyManagementProvider } from "@/contexts/keyManager";
import { KeyProvider } from "@/contexts/keyManagerCtx";
import { useAuth } from "@/hooks/useAuth";
import { SignModalProvider } from "../app/SignModal";
import { Sidebar } from "@/components/app/sidebar/Sidebar";
import { Outlet } from "react-router-dom";


// const Sidebar = () => {
//   const navItems = [
//     // { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
//     // { icon: MessageCircle, label: "Topics", to: "/topics" },
//     { icon: Coins, label: "Tokens", to: "/dashboard/tokens" },
//     { icon: User, label: "Account", to: "/dashboard/account" },
//     // { icon: Settings, label: "Settings", to: "/settings" },
//   ];

//   return (
//     <div className="flex flex-col h-full w-64 bg-background border-r border-border">
//       <div className="p-3"></div>
//       <nav className="flex-1 px-4">
//         <Link
//           to="/dashboard"
//           className={cn(
//             "flex items-center px-4 py-3 mb-2 text-sm rounded-lg transition-all duration-200 ease-in-out",
//             "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
//           )}
//         >
//           <LayoutDashboard className="mr-3 h-5 w-5" />
//           Dashboard
//         </Link>
//         {navItems.map((item, index) => (
//           <NavLink
//             key={index}
//             to={item.to}
//             className={({ isActive }) =>
//               cn(
//                 "flex items-center px-4 py-3 mb-2 text-sm rounded-lg transition-all duration-200 ease-in-out",
//                 isActive
//                   ? "bg-primary text-primary-foreground shadow-md"
//                   : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
//               )
//             }
//           >
//             <item.icon className="mr-3 h-5 w-5" />
//             {item.label}
//           </NavLink>
//         ))}
//       </nav>
//     </div>
//   );
// };


const DashboardLayout = () =>
{
  const { user } = useAuth()
  return (
    <KeyProvider userId={user!.$id} >
      <SignModalProvider>
        <Sidebar>
          <Outlet />
        </Sidebar>
      </SignModalProvider>
    </KeyProvider>
  );
};

export default DashboardLayout;