import React, { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";

// Icons
import { 
  Plus, 
  Trash2, 
  ShieldCheck 
} from "lucide-react";

// Context Definition Type
interface ContextDefinition {
  context: Record<string, string>;
  type: string;
  fields: Record<string, string>;
}

// Dynamic Zod Schema for VC Creation
const createVCCreationSchema = () => z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  
  // Context management
  contextDefinitions: z.array(z.object({
    type: z.string(),
    context: z.record(z.string(), z.string()),
    fields: z.record(z.string(), z.string())
  })).optional(),

  // Dynamic credential subject with type validation
  credentialSubject: z.array(
    z.object({
      key: z.string().nonempty("Key is required"),
      value: z.string().nonempty("Value is required"),
      type: z.string().optional(),
      contextType: z.string().optional(),
      mandatory: z.boolean().default(false)
    })
  ).default([])
});

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
  // Dynamic schema creation
  const VCCreationSchema = createVCCreationSchema();

  // Form setup with dynamic schema
  const form = useForm<z.infer<typeof VCCreationSchema>>({
    resolver: zodResolver(VCCreationSchema),
    defaultValues: {
      contextDefinitions: [],
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

  // Handle context import
  const handleContextImport = (contextDef: ContextDefinition) => {
    // Add context definition
    const currentContexts = form.getValues('contextDefinitions') || [];
    const updatedContexts = [...currentContexts, contextDef];
    form.setValue('contextDefinitions', updatedContexts);

    // Add fields from context to credential subject
    Object.entries(contextDef.fields).forEach(([key, type]) => {
      appendSubjectField({
        key,
        value: '',
        type,
        contextType: contextDef.type,
        mandatory: false
      });
    });
  };

  // Remove context and its associated fields
  const removeContext = (contextType: string) => {
    // Remove context definition
    const currentContexts = form.getValues('contextDefinitions') || [];
    const updatedContexts = currentContexts.filter(ctx => ctx.type !== contextType);
    form.setValue('contextDefinitions', updatedContexts);

    // Remove associated subject fields
    const currentSubjectFields = form.getValues('credentialSubject') || [];
    const updatedSubjectFields = currentSubjectFields.filter(
      field => field.contextType !== contextType
    );
    
    // Reset field array
    form.setValue('credentialSubject', []);
    updatedSubjectFields.forEach(field => appendSubjectField(field));
  };

  const handleSubmit = (data: any) => {
    onSubmit(data);
  };

  // Simulated context import (replace with actual import logic)
  const exampleContext: ContextDefinition = {
    context: {
      '@protected': 'true',
      AlumniCredential: 'urn:example:AlumniCredential',
      alumniOf: 'https://schema.org#alumniOf',
      name: 'https://schema.org#name',
      currentGrade: 'https://schema.org#number',
      graduationDate: 'https://schema.org#date',
      isGraduated: 'https://schema.org#boolean'
    },
    type: 'AlumniCredential',
    fields: {
      alumniOf: 'string',
      currentGrade: 'number',
      graduationDate: 'date',
      isGraduated: 'boolean'
    }
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
            {/* Context Definitions */}
            <Card>
              <CardHeader>
                <CardTitle>Imported Contexts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => handleContextImport(exampleContext)}
                  >
                    Import Alumni Context
                  </Button>
                </div>

                {form.watch('contextDefinitions')?.map((context) => (
                  <div 
                    key={context.type} 
                    className="flex items-center justify-between mt-2 p-2 border rounded"
                  >
                    <div>
                      <Badge>{context.type}</Badge>
                      <span className="ml-2 text-sm text-muted-foreground">
                        Fields: {Object.keys(context.fields).join(', ')}
                      </span>
                    </div>
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="icon"
                      onClick={() => removeContext(context.type)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
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
                      readOnly={!!field.contextType}
                    />
                    <Input
                      placeholder="Property Value"
                      {...form.register(`credentialSubject.${index}.value`)}
                    />
                    <Input
                      placeholder="Type"
                      value={field.type}
                      readOnly
                      className="bg-muted"
                    />
                    {field.contextType && (
                      <Badge variant="secondary">{field.contextType}</Badge>
                    )}
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
                    {!field.contextType && (
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="icon"
                        onClick={() => removeSubjectField(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button 
                  type="button"
                  variant="secondary"
                  onClick={() => appendSubjectField({
                    key: '',
                    value: '',
                    type: '',
                    mandatory: false
                  })}
                  className="mt-2"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Manual Field
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