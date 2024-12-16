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

// Icons
import { 
  Loader2, 
  Plus, 
  Trash2, 
  ShieldCheck 
} from "lucide-react";

// Services and Contexts
import { toast } from "@/hooks/use-toast";

// Enhanced Zod Schema for VC Creation
const VCCreationSchema = z.object({
  // Base VC Metadata
  name: z.string().optional(),
  description: z.string().optional(),
  
  // Validity Periods
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  
  // Subject Metadata
  subject: z.object({
    id: z.string().optional(), // DID or identifier
    name: z.string().optional()
  }).optional(),

  // Contexts with improved typing
  contexts: z.array(
    z.object({
      type: z.string(), // Type of context (e.g., "schema", "extension")
      context: z.record(z.string(), z.any()), // Actual context definition
      fields: z.array(
        z.object({
          key: z.string(),
          type: z.string().optional(),
          description: z.string().optional()
        })
      ).optional()
    })
  ).default([]),

  // Credential Subject Fields
  credentialSubject: z.array(
    z.object({
      key: z.string().nonempty("Key is required"),
      value: z.string().nonempty("Value is required"),
      mandatory: z.boolean().default(false),
      contextRef: z.string().optional(), // Reference to context
      type: z.string().optional(), // Field type from context
      description: z.string().optional()
    })
  ).default([]),

  // Storage Options
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
            {/* VC Metadata */}
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

            {/* Validity Periods */}
            <Card>
              <CardHeader>
                <CardTitle>Validity Period</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="validFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid From</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        When does this credential become valid?
                      </FormDescription>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid Until</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          {...field}
                          onChange={(e) => {
                            // // Convert local datetime to ISO string
                            // const isoDate = new Date(e.target.value).toISOString();
                            // field.onChange(isoDate);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        When does this credential expire?
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Subject Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Subject Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="subject.id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject DID</FormLabel>
                      <FormControl>
                        <Input placeholder="DID of the credential subject" {...field} />
                      </FormControl>
                      <FormDescription>
                        Decentralized Identifier for the subject
                      </FormDescription>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subject.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional subject name" {...field} />
                      </FormControl>
                      <FormDescription>
                        Name of the credential subject
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Contexts Management */}
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
                        onClick={() => removeContext(index)}
                        className="self-end"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Dynamic Fields for this Context */}
                    <div className="mt-4">
                      <FormLabel>Context Fields</FormLabel>
                      {context.fields?.map((field, fieldIndex) => (
                        <div 
                          key={`${context.id}-field-${fieldIndex}`} 
                          className="flex space-x-2 mb-2"
                        >
                          <Input
                            placeholder="Field Key"
                            value={field.key}
                            onChange={(e) => {
                              const newContexts = [...form.watch("contexts")];
                              newContexts[index].fields![fieldIndex].key = e.target.value;
                              form.setValue("contexts", newContexts);
                            }}
                          />
                          <Input
                            placeholder="Field Type"
                            value={field.type}
                            onChange={(e) => {
                              const newContexts = [...form.watch("contexts")];
                              newContexts[index].fields![fieldIndex].type = e.target.value;
                              form.setValue("contexts", newContexts);
                            }}
                          />
                        </div>
                      ))}
                      <Button 
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          const newContexts = [...form.watch("contexts")];
                          if (!newContexts[index].fields) {
                            newContexts[index].fields = [];
                          }
                          newContexts[index].fields!.push({
                            key: "",
                            type: "",
                            description: ""
                          });
                          form.setValue("contexts", newContexts);
                        }}
                        className="mt-2"
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add Context Field
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => appendContext({
                    type: "",
                    context: {},
                    fields: []
                  })}
                  className="mt-4"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Context
                </Button>
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
                    <Input
                      placeholder="Field Type"
                      {...form.register(`credentialSubject.${index}.type`)}
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
                    type: ""
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