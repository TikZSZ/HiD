import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from "@/components/ui/select";
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage, 
  FormDescription 
} from "@/components/ui/form";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "./PageHeader";

// Icons
import { Loader2, Plus, Trash2, Eye } from "lucide-react";

// Services and Contexts
import AppwriteService, { 
  VCDocument, 
  VCStoreDocument, 
  CreateVCDTO,
  CreateVCStoreDTO,
  VCStoreType,
  StoredByEnum
} from "@/HiD/appwrite/service";
import { useKeyContext } from "@/contexts/keyManagerCtx";
import { toast } from "@/hooks/use-toast";
import ErrorComponent from "../ErrorComponent";

// W3C Verifiable Credentials Base Schema
const W3CVCBaseSchema = z.object({
  "@context": z.array(z.union([
    z.string(),
    z.record(z.string(), z.string())
  ])).default(["https://www.w3.org/2018/credentials/v1"]),
  type: z.array(z.string()).default(["VerifiableCredential"]),
  issuer: z.string().optional(),
  issuanceDate: z.string().datetime().optional(),
  expirationDate: z.string().datetime().optional(),
  credentialSubject: z.record(z.string(), z.any()).optional()
});

// VC Creation Schema
const VCCreationSchema = z.object({
  keyId: z.string().nonempty("Select a key to sign the credential"),
  storeType: z.nativeEnum(VCStoreType).default(VCStoreType.CLOUD),
  vcData: W3CVCBaseSchema
});

const VCViewPage: React.FC = () => {
  const { vcId } = useParams<{ vcId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userId } = useKeyContext();

  const [isCreateStoreModalOpen, setIsCreateStoreModalOpen] = useState(false);
  if(!vcId) return <ErrorComponent message="VC Not Found" />
  // Fetch specific VC details
  const {
    data: vcDocument,
    isLoading: isLoadingVC
  } = useQuery({
    queryKey: ['vcDetails', vcId],
    queryFn: () => vcId ? AppwriteService.getVCDoc(vcId) : Promise.resolve(null),
    enabled: !!vcId,
  });

  // Fetch VC Stores
  const {
    data: vcStores = [],
    isLoading: isLoadingStores
  } = useQuery<VCStoreDocument[]>({
    queryKey: ['vcStores', vcId],
    queryFn: () => vcId ? AppwriteService.listVCStores(vcId) : Promise.resolve([]),
    enabled: !!vcId,
  });

  // Create Store Mutation
  const createVCStoreMutation = useMutation({
    mutationFn: async (formData: z.infer<typeof VCCreationSchema>) => {
      // File upload
      const jsonBlob = new Blob([JSON.stringify(formData.vcData)], { type: 'application/json' });
      const jsonFile = new File([jsonBlob], 'vc-document.json', { type: 'application/json' });
      
      const { url } = await AppwriteService.uploadFile(jsonFile);

      // Create VC Store
      const storeData: CreateVCStoreDTO = {
        vcId: vcId!,
        location: url,
        storageType: formData.storeType
      };

      return AppwriteService.addStore(
        storeData, 
        StoredByEnum.USER, 
        userId
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vcStores', vcId] });
      setIsCreateStoreModalOpen(false);
      toast({
        title: "Store Created",
        description: "Verifiable Credential store created successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create store: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Form for Creating VC Store
  const CreateVCStoreModal: React.FC = () => {
    const form = useForm<z.infer<typeof VCCreationSchema>>({
      resolver: zodResolver(VCCreationSchema),
      defaultValues: {
        keyId: vcDocument?.signedBy.$id,
        storeType: VCStoreType.CLOUD,
        vcData: {
          "@context": ["https://www.w3.org/2018/credentials/v1"],
          type: ["VerifiableCredential"],
          issuanceDate: new Date().toISOString(),
          credentialSubject: {}
        }
      }
    });
    const { fields, append, remove } = useFieldArray({
      control: form.control,
      // @ts-ignore
      name: "vcData.credentialSubject"
    });

    const handleSubmit = (data: z.infer<typeof VCCreationSchema>) => {
      console.log(data)
      // createVCStoreMutation.mutate(data);
    };

    return (
      <Dialog open={isCreateStoreModalOpen} onOpenChange={setIsCreateStoreModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create VC Store</DialogTitle>
            <DialogDescription>
              Create a new storage location for this Verifiable Credential
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Store Type Selection */}
              <FormField
                name="storeType"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select storage type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(VCStoreType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose where to store this verifiable credential
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dynamic Credential Subject Fields */}
              <div>
                <FormLabel>Credential Subject Properties</FormLabel>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex space-x-2 mb-2">
                    <Input
                      placeholder="Property Name"
                      {...form.register(`vcData.credentialSubject.${index}.key` as const)}
                    />
                    <Input
                      placeholder="Property Value"
                      {...form.register(`vcData.credentialSubject.${index}.value` as const)}
                    />
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="icon" 
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => append({ key: "", value: "" })}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Property
                </Button>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="submit" 
                  disabled={createVCStoreMutation.isPending}
                >
                  {createVCStoreMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Create Store
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="relative h-full flex flex-col p-4 min-h-[90vh]">
      <PageHeader 
        title="Verifiable Credential Details" 
        description="View and manage this specific Verifiable Credential" 
        onClick={() => {}} 
      />

      {isLoadingVC ? (
        <div className="flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : vcDocument ? (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Credential Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold">Identifier</p>
                  <p>{vcDocument.identifier}</p>
                </div>
                <div>
                  <p className="font-semibold">Issuer</p>
                  <p>{vcDocument.issuer.name}</p>
                </div>
                <div>
                  <p className="font-semibold">Signed By</p>
                  <p>{vcDocument.signedBy.name}</p>
                </div>
                {vcDocument.holder && (
                  <div>
                    <p className="font-semibold">Holder</p>
                    <p>{vcDocument.holder.name}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Credential Stores</h3>
              <Button onClick={() => setIsCreateStoreModalOpen(true)}>
                Create Store
              </Button>
            </div>

            {isLoadingStores ? (
              <div className="flex justify-center items-center p-4">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : vcStores.length > 0 ? (
              <Table className="mt-4">
                <TableHeader>
                  <TableRow>
                    <TableCell>Storage Type</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Stored By</TableCell>
                    <TableCell>Created At</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vcStores.map((store) => (
                    <TableRow key={store.$id}>
                      <TableCell>
                        <Badge variant="secondary">{store.storageType}</Badge>
                      </TableCell>
                      <TableCell>{store.location}</TableCell>
                      <TableCell>{store.storedBy}</TableCell>
                      <TableCell>
                        {new Date(store.$createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground mt-4">No credential stores found.</p>
            )}
          </div>

          {/* Create Store Modal */}
          <CreateVCStoreModal />
        </>
      ) : (
        <p className="text-center text-muted-foreground">
          No Verifiable Credential found with the given ID.
        </p>
      )}
    </div>
  );
};

export default VCViewPage;