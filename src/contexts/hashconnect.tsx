import
  {
    createContext,
    PropsWithChildren,
    useContext,
    useEffect,
    useState,
  } from "react";
import type { HashConnect, SessionData } from "hashconnect";
import { type DappMetadata, HashConnectConnectionState } from "hashconnect/dist/types";
import { hashconnect } from "@/HiD/hashconnect";
import { AccountId, Client, Signer } from "@hashgraph/sdk";

export type HashConnectContent = {
  accountIds?: string[],
  setAccountIds: Function,
  selectedAccount: string | null
  setSelectedAccount: ( accountId: string ) => void
  getSigner:() => Signer|null,
  pairingData: SessionData | null,
  state: HashConnectConnectionState,
  hashconnect: HashConnect | null
  connectToExtension: Function,
  disconnect: Function,
  init: Function
  isConnected: boolean
  isLoading: boolean
  // sendTransaction: Function,
}
const HashConnectContext = createContext<HashConnectContent>( {
  accountIds: [ "" ],
  setAccountIds: ( accountId: string ) => { },
  pairingData: null,
  hashconnect: null,
  state: HashConnectConnectionState.Disconnected,
  //   sendTransaction: () => {},
  connectToExtension: () => { },
  disconnect: () => { },
  init: () => { },
  isConnected: false
} as any as HashConnectContent );



export default function HashConnectProvider ( { children }: PropsWithChildren )
{
  const [ accountIds, setAccountIds ] = useState<string[]>( [] );
  const [ isConnected, setIsConnected ] = useState<boolean>( false );
  const [ selectedAccount, setSelectedAccount ] = useState<string | null>( null );
  const [ pairingString, setPairingString ] = useState<string | undefined>( "" );
  const [ pairingData, setPairingData ] =
    useState<SessionData | null>( null );
  const [ isLoading, setLoading ] = useState( false )
  const [ state, setState ] = useState( HashConnectConnectionState.Disconnected );

  //   useEffect(() => {
  //     init();
  //   }, []);

  const init = async () =>
  {
    // hashconnect = new HashConnect(
    //     LedgerId.TESTNET,
    //     projectId,
    //     appMetadata,
    //     false
    //   );
    //register events

    //initialize
    setLoading( true )
    setUpHashConnectEvents();
    await hashconnect.init();
  };

  useEffect( () =>
  {
    console.log( isConnected )
    if ( pairingData && pairingData.accountIds.length > 0 )
    {
      setIsConnected( true )
    } else
    {
      setIsConnected( false )
    }
  }, [ pairingData ] )

  const setUpHashConnectEvents = () =>
  {

    //This is fired when a wallet approves a pairing
    hashconnect.pairingEvent.on( ( data ) =>
    {
      console.log( "Paired with wallet", data );
      if ( data )
      {
        setPairingData( data );
        setAccountIds( data.accountIds )
        setSelectedAccount( data.accountIds[ 0 ] )
      }
      setLoading( false )
    } );

    hashconnect.disconnectionEvent.on( () =>
    {
      setPairingData( null );
      setAccountIds( [] )
      setSelectedAccount( null )
      setState( HashConnectConnectionState.Disconnected )
    } );

    //This is fired when HashConnect loses connection, pairs successfully, or is starting connection
    hashconnect.connectionStatusChangeEvent.on( ( state ) =>
    {
      console.log( "hashconnect state change event", state );
      setState( state );
    } );
  };

  const connectToExtension = async () =>
  {
    //this will automatically pop up a pairing request in the HashConnect extension
    hashconnect.openPairingModal();
  };

  const getSigner = () =>
  {
    if(isConnected && selectedAccount){
      // @ts-ignore
      return (hashconnect.getSigner(AccountId.fromString(selectedAccount))) as any
    }
    return null
  }

  const disconnect = async () =>
  {
    await hashconnect.disconnect();
  };


  return (
    <HashConnectContext.Provider
      value={{
        // hcData,
        init,
        hashconnect,
        accountIds,
        setAccountIds,
        pairingData,
        state,
        connectToExtension,
        disconnect,
        isConnected,
        selectedAccount,
        setSelectedAccount,
        isLoading,
        getSigner
        // sendTransaction,
      }}
    >
      {children}
    </HashConnectContext.Provider>
  );
}

export function useWallet ()
{
  return useContext( HashConnectContext );
}