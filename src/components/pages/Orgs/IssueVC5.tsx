import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

// Icons
import { 
  Plus, 
  Trash2, 
  ShieldCheck,
  FileUp 
} from "lucide-react";

// Services and Contexts
import { toast } from "@/hooks/use-toast";

// Enhanced Zod Schema for VC Creation
const VCCreationSchema = z.object({
  // Restore original metadata fields
  name: z.string().optional(),
  description: z.string().optional(),
  
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  
  subject: z.object({
    id: z.string().optional(),
    name: z.string().optional()
  }).optional(),

  // Contexts with more flexible structure
  contexts: z.array(
    z.object({
      type: z.string(),
      context: z.record(z.string(), z.any()),
      originalFile: z.string().optional()
    })
  ).default([]),

  // Credential Subject with optional context reference
  credentialSubject: z.array(
    z.object({
      key: z.string().nonempty("Key is required"),
      value: z.string().nonempty("Value is required"),
      mandatory: z.boolean().default(false),
      contextRef: z.string().optional()
    })
  ).default([])
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
  // Form Setup
  const form = useForm<z.infer<typeof VCCreationSchema>>({
    resolver: zodResolver(VCCreationSchema),
    defaultValues: {
      name: "",
      description: "",
      subject: {},
      contexts: [],
      credentialSubject: []
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

  // File Drop Handler
  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          // Parse the file content
          const parsedContext = JSON.parse(event.target?.result as string);
          
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
          appendContext({
            type: parsedContext.type || file.name.replace('.json', ''),
            context: parsedContext.context,
            originalFile: file.name
          });

          // Add fields to credentialSubject
          Object.entries(parsedContext.fields).forEach(([key]) => {
            // Only add if the key doesn't already exist
            const existingField = form.watch("credentialSubject")
              .find(field => field.key === key);
            
            if (!existingField) {
              appendSubjectField({
                key,
                value: "",
                mandatory: false,
                contextRef: parsedContext.type || file.name.replace('.json', '')
              });
            }
          });

          toast({
            title: "Context Imported",
            description: `Context from ${file.name} added successfully.`
          });
        } catch (error) {
          toast({
            title: "Import Failed",
            description: "Could not parse the context file. Please check the format.",
            variant: "destructive"
          });
        }
      };
      
      reader.readAsText(file);
    });
  }, [appendContext, appendSubjectField, form]);

  // Dropzone setup
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json']
    },
    multiple: true
  });

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
            {/* Restore all original form sections from the previous implementation */}
            {/* VC Metadata Card */}
            <Card>
              <CardHeader>
                <CardTitle>Credential Metadata</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credential Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional credential name" {...field} />
                      </FormControl>
                      <FormDescription>
                        A human-readable name for the credential
                      </FormDescription>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional description" {...field} />
                      </FormControl>
                      <FormDescription>
                        Provide additional context about the credential
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Context Import Section */}
            <Card>
              <CardHeader>
                <CardTitle>Import Context</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  {...getRootProps()}
                  className={`
                    border-2 border-dashed p-6 text-center cursor-pointer 
                    ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                  `}
                >
                  <input {...getInputProps()} />
                  <p className="text-gray-600">
                    Drag 'n' drop context JSON files here, or click to select files
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Imported Contexts Display */}
            {contextsFields.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Imported Contexts</CardTitle>
                </CardHeader>
                <CardContent>
                  {contextsFields.map((context, index) => (
                    <div 
                      key={context.id} 
                      className="border p-4 mb-2 rounded flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">{context.type}</p>
                        <p className="text-sm text-gray-500">
                          {context.originalFile || 'Custom Context'}
                        </p>
                      </div>
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="icon"
                        onClick={() => removeContextAndFields(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

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