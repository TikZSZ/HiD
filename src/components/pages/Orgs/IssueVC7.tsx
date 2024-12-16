import React, { useState, useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";

// UI Components
import { Button } from "@/components/ui/button";
import
{
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import
{
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
import
{
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Plus, Trash2, ShieldCheck, FileUp, Calendar as CalendarIcon } from "lucide-react";

const VCCreationSchema = z.object({
  name: z.string().nonempty("Name is required"),
  description: z.string().nonempty("Description is required"),
  credentialSubject: z.array(
    z.object({
      key: z.string(),
      value: z.union([z.string(), z.number(), z.date()]),
      mandatory: z.boolean(),
      name: z.string().nonempty("Field name is required"),
      description: z.string().optional(),
      dataType: z.string(),
    })
  ).min(1, "At least one field is required"),
});

const DynamicInput = ({ dataType, value, onChange, placeholder, field }) => {
  switch (dataType) {
    case "date":
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(value, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={value} onSelect={onChange} initialFocus />
          </PopoverContent>
        </Popover>
      );
    case "number":
      return (
        <Input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value))}
          placeholder={placeholder}
        />
      );
    case "boolean":
      return <Checkbox checked={value || false} onCheckedChange={onChange} />;
    default:
      return (
        <Input
          // value={value || ""}
          // onChange={(e) => onChange(e.target.value)}
          {...field}
          placeholder={placeholder}
        />
      );
  }
};

const CreateVCModal = ({ isOpen, onOpenChange, onSubmit }) => {
  const form = useForm({
    resolver: zodResolver(VCCreationSchema),
    defaultValues: {
      name: "",
      description: "",
      credentialSubject: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "credentialSubject",
  });

  const onDrop = useCallback(
    (acceptedFiles) => {
      acceptedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const parsedContext = JSON.parse(event.target.result);
            if (!parsedContext.context || !parsedContext.fields) {
              toast({
                title: "Invalid Context",
                description: "The imported context is missing required fields.",
                variant: "destructive",
              });
              return;
            }

            Object.entries(parsedContext.fields).forEach(([key, details]) => {
              append({
                key,
                value: "",
                mandatory: !details.optional,
                name: details.name,
                description: details.description,
                dataType: details.type,
              });
            });
            toast({
              title: "Context Imported",
              description: `${file.name} added successfully.`,
            });
          } catch {
            toast({
              title: "Import Failed",
              description: "Could not parse the context file.",
              variant: "destructive",
            });
          }
        };
        reader.readAsText(file);
      });
    },
    [append]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "application/json": [".json"] },
    multiple: false,
  });

  const handleSubmit = (data) => {
    onSubmit(data);
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
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter name" />
                      </FormControl>
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
                        <Input {...field} placeholder="Enter description" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Import Context</CardTitle>
              </CardHeader>
              <CardContent>
                <div {...getRootProps()} className="border-2 border-dashed p-6">
                  <input {...getInputProps()} />
                  <p>Drag & drop a JSON file, or click to select</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Credential Subject</CardTitle>
              </CardHeader>
              <CardContent>
                {fields.map((field, index) => (
                  <div key={field.id} className="mb-4">
                    <FormField
                      control={form.control}
                      name={`credentialSubject.${index}.value`}
                      render={({ field: fieldProps }) => (
                        <DynamicInput
                          dataType={field.dataType}
                          value={fieldProps.value}
                          onChange={fieldProps.onChange}
                          placeholder={`Enter ${field.name}`}
                          field={fieldProps}
                        />
                      )}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => remove(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateVCModal;
