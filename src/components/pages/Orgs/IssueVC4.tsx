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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// Icons
import { 
  Loader2, 
  Plus, 
  Trash2, 
  ShieldCheck,
  FileUp 
} from "lucide-react";

// Services and Contexts
import { toast } from "@/hooks/use-toast";

// Enhanced Zod Schema for VC Creation
const VCCreationSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  
  subject: z.object({
    id: z.string().optional(),
    name: z.string().optional()
  }).optional(),

  contexts: z.array(
    z.object({
      type: z.string(),
      context: z.record(z.string(), z.string().or(z.boolean())),
      fields: z.array(
        z.object({
          key: z.string(),
          type: z.string().optional(),
          description: z.string().optional()
        })
      ).optional()
    })
  ).default([]),

  credentialSubject: z.array(
    z.object({
      key: z.string().nonempty("Key is required"),
      value: z.string().nonempty("Value is required"),
      mandatory: z.boolean().default(false),
      contextRef: z.string().optional(),
      type: z.string().optional(),
      description: z.string().optional()
    })
  ).default([]),

  storeType: z.enum(["CLOUD", "LOCAL", "CUSTOM"]).default("CLOUD")
});

// Type mapping for form input conversions
const TYPE_MAPPING: Record<string, string> = {
  'string': 'text',
  'number': 'number', 
  'date': 'date', 
  'datetime': 'datetime-local', 
  'boolean': 'checkbox'
};
interface CreateVCModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
}
export const CreateVCModal: React.FC<CreateVCModalProps> = ({
  isOpen,
  onOpenChange,
  onSubmit
}) => {
  const [importedContext, setImportedContext] = useState<any | null>(null);

  // Form Setup
  const form = useForm<z.infer<typeof VCCreationSchema>>({
    resolver: zodResolver(VCCreationSchema),
    defaultValues: {
      name: "",
      description: "",
      subject: {},
      contexts: [],
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

  const { 
    fields: contextsFields, 
    append: appendContext, 
    remove: removeContext 
  } = useFieldArray({
    control: form.control,
    name: "contexts"
  });

  // Context Import Handler
  const handleContextImport = () => {
    try {
      // Parse the imported context JSON
      const parsedContext = JSON.parse(importedContext);
      
      // Validate basic structure
      if (!parsedContext.context || !parsedContext.fields) {
        toast({
          title: "Invalid Context",
          description: "The imported context is missing required fields.",
          variant: "destructive"
        });
        return;
      }

      // Add context to contexts array
      const newContextIndex = form.watch("contexts").length;
      form.setValue(`contexts.${newContextIndex}`, {
        type: parsedContext.type || "Custom",
        context: parsedContext.context,
        fields: Object.entries(parsedContext.fields).map(([key, type]) => ({
          key,
          type: type as string
        }))
      });

      // Add fields to credentialSubject with appropriate types
      Object.entries(parsedContext.fields).forEach(([key, type]) => {
        appendSubjectField({
          key,
          value: "",
          type: type as string,
          mandatory: false,
          contextRef: parsedContext.type || "Custom"
        });
      });

      // Clear import input
      setImportedContext(null);

      toast({
        title: "Context Imported",
        description: `Context for ${parsedContext.type || 'Custom Type'} added successfully.`
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Could not parse the context JSON. Please check the format.",
        variant: "destructive"
      });
    }
  };

  // Remove Context and Associated Fields
  const removeContextAndFields = (contextIndex: number) => {
    const contextToRemove = form.watch("contexts")[contextIndex];
    
    // Remove associated subject fields
    const updatedSubjectFields = form.watch("credentialSubject").filter(
      field => field.contextRef !== contextToRemove.type
    );

    // Update form values
    form.setValue("credentialSubject", updatedSubjectFields);
    removeContext(contextIndex);
  };

  const handleSubmit = (data: z.infer<typeof VCCreationSchema>) => {
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
            {/* Context Import Section */}
            <Card>
              <CardHeader>
                <CardTitle>Import Context</CardTitle>
              </CardHeader>
              <CardContent className="flex space-x-2">
                <textarea 
                  className="flex-grow border p-2 rounded"
                  placeholder="Paste context JSON here"
                  value={importedContext || ''}
                  onChange={(e) => setImportedContext(e.target.value)}
                  rows={3}
                />
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={handleContextImport}
                  disabled={!importedContext}
                >
                  <FileUp className="mr-2 h-4 w-4" /> Import Context
                </Button>
              </CardContent>
            </Card>

            {/* Rest of the existing form remains the same... */}
            
            {/* Contexts Management (modified to support removal) */}
            <Card>
              <CardHeader>
                <CardTitle>Context Definitions</CardTitle>
              </CardHeader>
              <CardContent>
                {contextsFields.map((context, index) => (
                  <div 
                    key={context.id} 
                    className="border p-4 mb-2 rounded"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`contexts.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Context Type</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., schema, extension" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="icon"
                        onClick={() => removeContextAndFields(index)}
                        className="self-end"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Credential Subject Fields (with type selection) */}
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
                    <Select
                      value={form.watch(`credentialSubject.${index}.type`)}
                      onValueChange={(value) => {
                        form.setValue(`credentialSubject.${index}.type`, value);
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Field Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(TYPE_MAPPING).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type={TYPE_MAPPING[form.watch(`credentialSubject.${index}.type`) || 'text']}
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
                    mandatory: false,
                    type: "string"
                  })}
                  className="mt-2"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Field
                </Button>
              </CardContent>
            </Card>

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