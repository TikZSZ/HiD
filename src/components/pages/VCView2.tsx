
import React, { useState, useEffect, useMemo } from "react";
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

// Icons
import { Loader2, Plus, Trash2, Eye } from "lucide-react";

// Services and Contexts
import AppwriteService, { 
  VCDocument, 
  VCStoreDocument, 
  CreateVCDTO,
  VCStoreType,
  StoredByEnum
} from "@/HiD/appwrite/service";
import { useKeyContext } from "@/contexts/keyManagerCtx";
import { toast } from "@/hooks/use-toast";
import { resolveDID } from "@/did";
import { DidDocument } from "@/HiD/did-sdk";

// W3C Verifiable Credentials Context Types
const W3CVCContextSchema = z.object({
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

// Dynamic VC Schema Generator
const generateDynamicVCSchema = (baseSchema: z.ZodObject<any>) => {
  return z.object({
    identifier: z.string().refine(
      (identifier) => {
        const parts = identifier.split(":");
        return parts.length === 4 && 
               parts[3].split("_").length === 2 && 
               parts[3].split("_")[1].split(".").length === 3;
      }, 
      { message: "Identifier should be of form did:hedera:network:....._TopicID" }
    ),
    keyId: z.string().nonempty("Select a key to sign the credential"),
    holderId: z.string().optional(),
    storeType: z.nativeEnum(VCStoreType).default(VCStoreType.CLOUD),
    vcData: baseSchema
  });
};

const VCViewPage: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userId, useOrgsList } = useKeyContext();
  
  const { data: orgs = [], isLoading: isLoadingOrgs } = useOrgsList();
  
  const [selectedOrgId, setSelectedOrgId] = useState(orgId || "");
  const [isCreateVCModalOpen, setIsCreateVCModalOpen] = useState(false);
  const [selectedVCId, setSelectedVCId] = useState<string | null>(null);

  // Fetch VCs for the selected organization
  const {
    data: vcs = [],
    isLoading: isLoadingVCs,
    refetch: refetchVCs
  } = useQuery<VCDocument[]>({
    queryKey: ['orgVCs', selectedOrgId],
    queryFn: () => AppwriteService.getCredentialsForOrg(selectedOrgId, userId),
    enabled: !!selectedOrgId,
  });

  // Fetch Stores for a specific VC
  const {
    data: vcStores = [],
    isLoading: isLoadingStores
  } = useQuery<VCStoreDocument[]>({
    queryKey: ['vcStores', selectedVCId],
    queryFn: () => selectedVCId ? AppwriteService.listVCStores(selectedVCId) : Promise.resolve([]),
    enabled: !!selectedVCId,
  });

  // Dynamic VC Form Component
  const DynamicVCForm: React.FC = () => {
    const [didDocument, setDidDocument] = useState<DidDocument>();
    
    // Fetch organization members and keys
    const { 
      data: orgMembers = [], 
      isLoading: isLoadingMembers 
    } = useQuery({
      queryKey: ['orgMembers', selectedOrgId],
      queryFn: () => AppwriteService.getOrgMembers(selectedOrgId),
      enabled: isCreateVCModalOpen
    });

    const { 
      data: keys = [], 
      isLoading: isLoadingKeys 
    } = useQuery({
      queryKey: ['memberKeys', selectedOrgId], 
      queryFn: () => AppwriteService.getKeysForOrgAndUser(userId, selectedOrgId),
      enabled: isCreateVCModalOpen
    });

    // Dynamic Form Schema
    const dynamicVCSchema = useMemo(() => 
      generateDynamicVCSchema(W3CVCContextSchema), 
      []
    );

    type DynamicVCFormValues = z.infer<typeof dynamicVCSchema>;

    const form = useForm<DynamicVCFormValues>({
      resolver: zodResolver(dynamicVCSchema),
      defaultValues: {
        identifier: "",
        keyId: "",
        holderId: "",
        storeType: VCStoreType.CLOUD,
        vcData: {
          "@context": ["https://www.w3.org/2018/credentials/v1"],
          type: ["VerifiableCredential"],
          issuanceDate: new Date().toISOString(),
          credentialSubject: {}
        }
      },
    });

    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "vcData.credentialSubject"
    });

    const issueVCMutation = useMutation({
      mutationFn: (data: DynamicVCFormValues) => {
        const { keyId, ...rest } = data;
        return AppwriteService.issueCredential(rest as CreateVCDTO, selectedOrgId, userId, keyId);
      },
      onSuccess: async (newVC) => {
        queryClient.invalidateQueries({ queryKey: ['orgVCs', selectedOrgId] });
        setIsCreateVCModalOpen(false);
        toast({
          title: "Credential Issued",
          description: "The Verifiable Credential has been successfully issued.",
        });
      },
      onError: (error) => {
        console.error("Error issuing credential:", error);
        toast({
          title: "Error",
          description: "Failed to issue credential. Please try again. " + error.message,
          variant: "destructive"
        });
      }
    });

    const handleFormSubmit = (data: DynamicVCFormValues) => {
      issueVCMutation.mutate(data);
    };

    return (
      <Dialog open={isCreateVCModalOpen} onOpenChange={setIsCreateVCModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Issue Verifiable Credential</DialogTitle>
            <DialogDescription>
              Create a new Verifiable Credential with customizable properties
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              {/* Identifier Field */}
              <FormField
                name="identifier"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credential Identifier</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter DID identifier" {...field} />
                    </FormControl>
                    <FormDescription>
                      A unique W3C Decentralized Identifier for this credential
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Key Selection */}
              <FormField
                name="keyId"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Signing Key</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={isLoadingKeys}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a key to sign the credential" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {keys.map((key) => (
                          <SelectItem key={key.$id} value={key.$id}>
                            {key.name} ({key.keyType})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The cryptographic key used to sign this credential
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Holder Selection (Optional) */}
              <FormField
                name="holderId"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credential Holder (Optional)</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={isLoadingMembers}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select credential holder" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {orgMembers.map((member) => (
                          <SelectItem key={member.$id} value={member.$id}>
                            {member.name} ({member.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The organization member who will be the subject of this credential
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                <FormLabel>Credential Subject</FormLabel>
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
                  disabled={issueVCMutation.isPending}
                >
                  {issueVCMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Issue Credential
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  };
}