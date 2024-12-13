import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { KeyIcon, PlusIcon, CircleCheckIcon, CreditCardIcon, MenuIcon, XIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile'; // Hook to detect mobile screens
import { KeyManagementOverlay } from './KeyManagementOverlay';
import CreateDIDPage from './DIDsPage';
import
{
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import
{
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useKeyContext } from '@/contexts/keyManagerCtx';

export function CardWithForm ()
{
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Create project</CardTitle>
        <CardDescription>Deploy your new project in one-click.</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Name of your project" />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Deploy</Button>
      </CardFooter>
    </Card>
  )
}
const SIDEBAR_WIDTH = 'w-64'; // Standard width for sidebar

const DIDWalletManager: React.FC = () =>
{
  const [ isSidebarOpen, setSidebarOpen ] = useState<boolean>( false ); // Mobile toggle
  const {isOpen,setIsOpen} = useKeyContext()
  const [ activeTab, changeActiveTab ] = useState<string>( 'key' );
  const isMobile = true; // Detect mobile screens
  const setActiveTab = ( tab: string ) =>
  {
    changeActiveTab( tab )
    setSidebarOpen( false )
  }
  const renderContent = () =>
  {
    switch ( activeTab )
    {
      case 'key':
        return <KeyManagementOverlay />;
      case 'did':
        return <CreateDIDPage />;
      default:
        return null;
    }
  };
  // useEffect(()=>{
  //   setIsOpen(true)
  // },[])
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-[70vw] max-w-7xl h-[85vh] ">
        {/* <DialogHeader>
          <DialogTitle>DID Wallet Manager</DialogTitle>
        </DialogHeader> */}

        <div className="relative w-full justify-between overflow-auto">
          {/* Sidebar */}
          <div>
            <div className='relative mx-auto'>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSidebarOpen( !isSidebarOpen )}
                className='absolute'
              >
                {isSidebarOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
              </Button>
              {/* <div className='relative mx-auto w-1/3' > <CardWithForm /></div> */}
            </div>
            <motion.div
              initial={{ x: isMobile ? -400 : 0 }} // Off-screen on mobile
              animate={{ x: isSidebarOpen || !isMobile ? 0 : -600 }} // Animate open/close
              transition={{ duration: 0.3 }}
              className={`z-50 absolute top-10 left-0 h-[90%] bg-background rounded-md border shadow-lg  ${SIDEBAR_WIDTH}  md:shadow-none`}
            >

              <nav className="p-4 space-y-2">
                <Button
                  variant={activeTab === 'key' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab( 'key' )}
                >
                  <KeyIcon className="mr-2 h-5 w-5" />
                  Key Management
                </Button>
                <Button
                  variant={activeTab === 'did' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab( 'did' )}
                >
                  <PlusIcon className="mr-2 h-5 w-5" />
                  Create DID
                </Button>
                <Button
                  variant={activeTab === 'didManagement' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab( 'didManagement' )}
                >
                  <CircleCheckIcon className="mr-2 h-5 w-5" />
                  DID Management
                </Button>
                <Button
                  variant={activeTab === 'vc' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab( 'vc' )}
                >
                  <CreditCardIcon className="mr-2 h-5 w-5" />
                  VC Management
                </Button>
              </nav>
            </motion.div>
          </div>

          {/* Sidebar Toggle Button */}


          {/* Content */}
          <div className="p-2 w-full overflow-x-hidden h-full">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="h-full flex items-center justify-center overflow-hidden"
            >

              <div className="w-full md:w-3/4">{renderContent()}</div>
            </motion.div>
          </div>
        </div>
        <div>
        <Separator />
        <DialogFooter>
          {/* <Button variant="outline" onClick={() => setSidebarOpen( false )}>
            Close
          </Button> */}
        </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DIDWalletManager;
