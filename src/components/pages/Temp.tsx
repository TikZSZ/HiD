// VC Stores Modal Component
// const VCStoresModal: React.FC<{
//   isOpen: boolean;
//   onOpenChange: (val: boolean) => void;
//   vcId: string;
// }> = ({ isOpen, onOpenChange, vcId }) => {
//   // Query to fetch VC stores
//   const { 
//     data: vcStores = [], 
//     isLoading 
//   } = useQuery<VCStoreDocument[]>({
//     queryKey: ['vcStores', vcId],
//     queryFn: () => AppwriteService.listVCStores(vcId),
//     enabled: isOpen
//   });

//   return (
//     <Dialog open={isOpen} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-2xl">
//         <DialogHeader>
//           <DialogTitle>Verifiable Credential Storage Locations</DialogTitle>
//           <DialogDescription>
//             List of all storage locations for this Verifiable Credential
//           </DialogDescription>
//         </DialogHeader>
        
//         {isLoading ? (
//           <div className="flex justify-center items-center p-4">
//             <Loader2 className="h-8 w-8 animate-spin" />
//           </div>
//         ) : vcStores.length === 0 ? (
//           <p className="text-center text-muted-foreground">
//             No storage locations found for this credential.
//           </p>
//         ) : (
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableCell>Location</TableCell>
//                 <TableCell>Storage Type</TableCell>
//                 <TableCell>Stored By</TableCell>
//                 <TableCell>Actions</TableCell>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {vcStores.map((store) => (
//                 <TableRow key={store.$id}>
//                   <TableCell>{store.location}</TableCell>
//                   <TableCell>
//                     <Badge variant="secondary">{store.storageType}</Badge>
//                   </TableCell>
//                   <TableCell>
//                     <Badge variant="outline">{store.storedBy}</Badge>
//                   </TableCell>
//                   <TableCell>
//                     <Button 
//                       variant="outline" 
//                       size="sm"
//                       onClick={() => window.open(store.location, '_blank')}
//                     >
//                       <LinkIcon className="h-4 w-4 mr-2" /> Open
//                     </Button>
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         )}
//       </DialogContent>
//     </Dialog>
//   );
// };
