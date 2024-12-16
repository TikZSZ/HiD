import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "../ToggleMode";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, Wallet } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"; // Import DropdownMenu components
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWallet } from "@/contexts/hashconnect";
import { Skeleton } from "../ui/skeleton";

const LoadingNavItems = () => (
  <div className="flex items-center space-x-4">
    <Skeleton className="h-10 w-20" />
    <Skeleton className="h-10 w-20" />
    <Skeleton className="h-10 w-10 rounded-full" />
  </div>
);

const NavItemsContent = ({ isLoading, children }: any) => {
  if (isLoading) {
    return <LoadingNavItems />;
  }
  return children;
};

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, loading } = useAuth();

  const {
    connectToExtension,
    disconnect,
    accountIds,
    setSelectedAccount,
    selectedAccount,
    isConnected,
    init,
    hashconnect,
    pairingData,
    state,
  } = useWallet();

  // useEffect(() => {
  //   init();
  // }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/"); // Redirect to the homepage or another route after logout
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      await isAuthenticated();
    };
    checkAuth();
  }, [isAuthenticated]);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const NavItems = () => (
    <NavItemsContent isLoading={loading}>
      <>
        <NavLink
          to="docs"
          className={({isActive}) =>
            (isActive ? "text-primary" : "dark:text-primary-foreground text-secondary-foreground")
          }
        >
          <Button variant="ghost" className="mr-4">
            Docs
          </Button>
        </NavLink>

        {user ? (
          <NavLink to="dashboard" className={({isActive}) =>
            (isActive ? "text-primary" : "dark:text-primary-foreground text-secondary-foreground")
          }>
            <Button variant="ghost" className="mr-4">
              Dashboard
            </Button>
          </NavLink>
        ) : null}

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="mr-4 md:mr-0" asChild>
              <Button variant="ghost" className="p-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={"/default-avatar.png"} alt={user.name} />
                  <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isConnected ? (
                <>
                  <DropdownMenuLabel>Wallet</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={selectedAccount!}
                    onValueChange={setSelectedAccount}
                  >
                    {accountIds?.map((account) => (
                      <DropdownMenuRadioItem key={account} value={account}>
                        <Wallet className="mr-2 h-4 w-4" />
                        {truncateAddress(account)}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => disconnect()}>
                    Disconnect Wallet
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => connectToExtension()}>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Button
              onClick={() => navigate("/login")}
              variant="default"
              className="mr-4"
            >
              Log In
            </Button>
            {/* <Button onClick={() => connectToExtension()} variant="outline">
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button> */}
          </>
        )}
      </>
    </NavItemsContent>
  );

  return (
    <header className="p-4 bg-card shadow-md top-0 bg-opacity-10 w-full  z-10 border-border border-b">
      <nav className="flex justify-between items-center max-w-6xl mx-auto">
        <Link to="/">
          <h1 className="text-2xl font-bold ">
            HiD
          </h1>
        </Link>
        <div className="flex items-center">
          <div className="relative mr-4">
            <ModeToggle />
          </div>
          <div className="hidden md:flex">
            <Suspense fallback={<LoadingNavItems />}>
              <NavItems />
            </Suspense>
          </div>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden pt-1">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent aria-describedby="" side="top" className="w-full">
              <SheetTitle>
                <VisuallyHidden.Root>Navbar</VisuallyHidden.Root>
              </SheetTitle>
              <nav
                onClick={() => {
                  setIsOpen(false);
                }}
                className="flex flex-col space-y-4 mt-8"
              >
                <Suspense fallback={<LoadingNavItems />}>
                  <NavItems />
                </Suspense>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;