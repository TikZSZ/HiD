import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";

// UI Components
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
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
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

// Icons
import { 
  Loader2, 
  Plus, 
  Trash2, 
  FileUp, 
  BookOpen, 
  ShieldCheck 
} from "lucide-react";

// Services and Contexts
import AppwriteService from "@/HiD/appwrite/service";
import { toast } from "@/hooks/use-toast";

// Predefined Contexts
const PREDEFINED_CONTEXTS = [
  { 
    name: "W3C Verifiable Credentials", 
    url: "https://www.w3.org/2018/credentials/v1" 
  },
  { 
    name: "Schema.org", 
    url: "https://schema.org" 
  },
  // Add more predefined contexts as needed
];

// Zod Schema for Context
const ContextSchema = z.object({
  url: z.string().url("Invalid URL"),
  name: z.string().optional()
});

// Enhanced VC Creation Schema
const VCCreationSchema = z.object({
  contexts: z.array(ContextSchema).default([
    { url: "https://www.w3.org/2018/credentials/v1" }
  ]),
  credentialSubject: z.array(
    z.object({
      key: z.string().nonempty("Key is required"),
      value: z.string().nonempty("Value is required"),
      mandatory: z.boolean().default(false),
      path: z.string().optional()
    })
  ).default([]),
  storeType: z.enum(["CLOUD", "LOCAL", "CUSTOM"]).default("CLOUD")
});

interface CreateVCModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: z.infer<typeof VCCreationSchema>) => void;
}

export const CreateVCModal: React.FC<CreateVCModalProps> = ({
  isOpen,
  onOpenChange,
  onSubmit
}) => {
  const [activeTab, setActiveTab] = useState<"manual" | "import">("manual");
  const [importedContextFile, setImportedContextFile] = useState<File | null>(null);

  // Context File Import Query
  const { data: availableContexts, isLoading: isContextLoading } = useQuery({
    queryKey: ["appwrite-contexts"],
    // queryFn: () => AppwriteService.listContextDefinitions()
    queryFn: () => [{
      name:"https://www.w3.org/2018/credentials/v1",
      url:"https://www.w3.org/2018/credentials/v1",
      $id:"https://www.w3.org/2018/credentials/v1"
    }]
  });

  // Form Setup
  const form = useForm<z.infer<typeof VCCreationSchema>>({
    resolver: zodResolver(VCCreationSchema),
    defaultValues: {
      contexts: [{ url: "https://www.w3.org/2018/credentials/v1" }],
      credentialSubject: [],
      storeType: "CLOUD"
    }
  });

  const { 
    fields: subjectFields, 
    append: appendSubjectField, 
    remove: removeSubjectField 
  } = useFieldArray({
    control: form.control,
    name: "credentialSubject"
  });

  const handleFileImport = async (file: File) => {
    try {
      const contextData = await AppwriteService.readContextFile(file);
      // Update form with imported context
      form.setValue("contexts", [
        ...form.getValues("contexts"),
        { url: contextData.url, name: contextData.name }
      ]);
      setImportedContextFile(file);
      toast({
        title: "Context Imported",
        description: `Imported context from ${file.name}`
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Could not import context file",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = (data: z.infer<typeof VCCreationSchema>) => {
    // Validate and submit VC
    onSubmit({
      ...data,
      // Additional processing if needed
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Create Verifiable Credential</DialogTitle>
          <DialogDescription>
            Configure and issue a new Verifiable Credential
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Contexts Management */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <BookOpen className="inline-block mr-2" />
                  Context Definitions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs 
                  value={activeTab} 
                  onValueChange={(tab) => setActiveTab(tab as "manual" | "import")}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                    <TabsTrigger value="import">Import Context</TabsTrigger>
                  </TabsList>
                  
                  {/* Manual Context Entry */}
                  <TabsContent value="manual">
                    <div className="space-y-2">
                      {form.watch("contexts").map((context, index) => (
                        <div 
                          key={index} 
                          className="flex items-center space-x-2"
                        >
                          <Input
                            placeholder="Context URL"
                            value={context.url}
                            onChange={(e) => {
                              const newContexts = [...form.watch("contexts")];
                              newContexts[index].url = e.target.value;
                              form.setValue("contexts", newContexts);
                            }}
                          />
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="icon"
                            onClick={() => {
                              const newContexts = form.watch("contexts")
                                .filter((_, i) => i !== index);
                              form.setValue("contexts", newContexts);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button 
                        type="button" 
                        variant="secondary"
                        onClick={() => form.setValue("contexts", [
                          ...form.watch("contexts"), 
                          { url: "" }
                        ])}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add Context
                      </Button>
                    </div>
                  </TabsContent>
                  
                  {/* Context Import */}
                  <TabsContent value="import">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <Input 
                          type="file" 
                          accept=".json,.jsonld"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileImport(file);
                          }}
                        />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                type="button" 
                                variant="outline"
                                disabled={isContextLoading}
                              >
                                <FileUp className="mr-2 h-4 w-4" />
                                Import from Appwrite
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Import context definitions stored in Appwrite
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      {availableContexts && (
                        <div className="grid grid-cols-3 gap-2">
                          {availableContexts.map((context) => (
                            <Button 
                              key={context.$id}
                              type="button"
                              variant="outline"
                              onClick={() => {
                                form.setValue("contexts", [
                                  ...form.watch("contexts"),
                                  { url: context.url, name: context.name }
                                ]);
                              }}
                            >
                              {context.name}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Credential Subject Fields */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <ShieldCheck className="inline-block mr-2" />
                  Credential Subject
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subjectFields.map((field, index) => (
                  <div 
                    key={field.id} 
                    className="flex items-center space-x-2 mb-2"
                  >
                    <Input
                      placeholder="Property Key"
                      {...form.register(`credentialSubject.${index}.key`)}
                    />
                    <Input
                      placeholder="Property Value"
                      {...form.register(`credentialSubject.${index}.value`)}
                    />
                    <Controller
                      name={`credentialSubject.${index}.mandatory`}
                      control={form.control}
                      render={({ field: checkboxField }) => (
                        <Checkbox
                          checked={checkboxField.value}
                          onCheckedChange={checkboxField.onChange}
                        />
                      )}
                    />
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="icon"
                      onClick={() => removeSubjectField(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button 
                  type="button"
                  variant="secondary"
                  onClick={() => appendSubjectField({
                    key: "",
                    value: "",
                    mandatory: false
                  })}
                  className="mt-2"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Field
                </Button>
              </CardContent>
            </Card>

            {/* Store Type Selection */}
            <FormField
              control={form.control}
              name="storeType"
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
                      <SelectItem value="CLOUD">Cloud Storage</SelectItem>
                      <SelectItem value="LOCAL">Local Storage</SelectItem>
                      <SelectItem value="CUSTOM">Custom Storage</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose where to store this Verifiable Credential
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit">
                Create Verifiable Credential
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateVCModal;