import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Coins, User, Activity, Clock } from "lucide-react";
import { useKeyContext } from '@/contexts/keyManagerCtx.2';
import SignModal, { useSignModal } from '../app/SignModal';
import { Button } from '../ui/button';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () =>
{

  const dashboardItems = [
    { title: 'Total Topics', icon: MessageCircle, value: '15' },
    { title: 'Total Tokens', icon: Coins, value: '5' },
    { title: 'Account Balance', icon: User, value: '1000 HBAR' },
    { title: 'Recent Transactions', icon: Activity, value: '23' },
  ];

  const recentActivity = [
    { timestamp: '2023-08-15 14:30', action: 'Token Transfer', amount: '50 HBAR' },
    { timestamp: '2023-08-15 13:45', action: 'Topic Created', amount: '-' },
    { timestamp: '2023-08-15 12:20', action: 'Account Update', amount: '-' },
    { timestamp: '2023-08-15 11:00', action: 'Token Minted', amount: '100 CTK' },
  ];

  const balanceData = [
    { name: 'Aug 10', balance: 800 },
    { name: 'Aug 11', balance: 900 },
    { name: 'Aug 12', balance: 850 },
    { name: 'Aug 13', balance: 1000 },
    { name: 'Aug 14', balance: 950 },
    { name: 'Aug 15', balance: 1000 },
  ];

  // const { keys, retrieveKey } = useKeyContext()
  // useEffect( () =>
  // {
  //   ( async () =>
  //   {
  //     console.log( keys )
  //     if ( keys.length > 0 )
  //     {
  //       const key = await retrieveKey( keys[ 0 ].$id, "9918180888" )
  //       console.log( key )
  //       const data = new Uint8Array([0,1,5])
  //       const signature = key.privateKey.sign(data)
  //       console.log(key.publicKey.verify(data,signature))
  //     }
  //   } )()
  // }, [ keys ] )

  // const [modalOpen, setModalOpen] = useState(false);
  // const [keyId, setKeyId] = useState("61ec6d97-2de7-4d5c-83e8-7f34d99230fe");
  // const signData = "Data that needs to be signed";
  // const purpose = "Authentication"; // You can customize this purpose
  
  // const { openSignModal } = useSignModal();
  // const handleSignDocument = () => {
  //   openSignModal(
  //     "ccf50f96-3d86-4b2b-84f9-ef5bd2d1f7b2", 
  //     "key-retrieval",
  //     {
  //     signData:'Data that needs to be signed', 
  //     purpose:'Authentication',
  //     onSuccess:(signature) => {
  //       // Handle successful signature
  //       console.log('Signed successfully', signature);
  //     },
  //     onError:(error) => {
  //       // Handle signature error
  //       console.error('Signing failed', error);
  //     }
  //     }
  //   );
  // };
  return (
    <div className="space-y-6">
      <div>
      {/* <Button onClick={() => handleSignDocument()}>Sign Data</Button> */}
    
      </div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardItems.map( ( item, index ) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ) )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Balance History</CardTitle>
          </CardHeader>
          <CardContent>
            {/* <ResponsiveContainer width="100%" height={300}>
              <LineChart data={balanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="balance" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer> */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {recentActivity.map( ( activity, index ) => (
                <li key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">{activity.timestamp}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-2">{activity.action}</span>
                    <span className="text-sm text-muted-foreground">{activity.amount}</span>
                  </div>
                </li>
              ) )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;