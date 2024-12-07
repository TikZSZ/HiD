import React, { useEffect, useState } from "react";
import axios from "axios";
import * as jsonld from "jsonld";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from "../ui/select";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";

type JSONLDContext = {
  [ key: string ]: any;
};

type DynamicFormProps = {
  context: string | JSONLDContext;
  onSubmit: ( formData: { [ key: string ]: any } ) => void;
};

const DynamicDIDForm: React.FC<DynamicFormProps> = ({ context, onSubmit }) => {
  const [schema, setSchema] = useState<any[]>([]);
  const [formData, setFormData] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    const resolveContext = async () => {
      try {
        let resolvedContext: JSONLDContext;

        if (typeof context === "string") {
          const response = await axios.get(context);
          resolvedContext = response.data["@context"] || response.data;
        } else {
          resolvedContext = context["@context"] || context;
        }

        console.log("Resolved Context:", resolvedContext);

        // Extract schema from the context
        const extractedSchema = extractSchema(resolvedContext);
        console.log("Extracted Schema:", extractedSchema);

        setSchema(extractedSchema);
      } catch (error) {
        console.error("Failed to resolve JSON-LD context:", error);
      }
    };

    resolveContext();
  }, [context]);

  const extractSchema = (context: JSONLDContext, parentKey = "") => {
    const schema = [];
    for (const [key, value] of Object.entries(context)) {
      if (typeof value === "object" && !Array.isArray(value)) {
        const field = {
          name: parentKey ? `${parentKey}.${key}` : key,
          type: value["@type"] || null,
          id: value["@id"] || null,
          container: value["@container"] || null,
          context: value["@context"] || null,
        };

        schema.push(field);

        // Recursively handle nested contexts
        if (value["@context"]) {
          const nestedFields = extractSchema(value["@context"], field.name);
          schema.push(...nestedFields);
        }
      }
    }
    return schema;
  };

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(formData);
  };

  const renderField = (field: any) => {
    const { name, type } = field;

    switch (type) {
      case "http://www.w3.org/2001/XMLSchema#string":
      case null: // Default to text input for undefined types
        return (
          <div key={name} className="mb-4">
            <Label>{name}</Label>
            <Input
              type="text"
              onChange={(e) => handleChange(name, e.target.value)}
            />
          </div>
        );
      case "http://www.w3.org/2001/XMLSchema#boolean":
        return (
          <div key={name} className="mb-4">
            <Label>{name}</Label>
            <Checkbox
              onCheckedChange={(checked) => handleChange(name, checked)}
            />
          </div>
        );
      case "http://www.w3.org/2001/XMLSchema#date":
        return (
          <div key={name} className="mb-4">
            <Label>{name}</Label>
            <Input
              type="date"
              onChange={(e) => handleChange(name, e.target.value)}
            />
          </div>
        );
      default:
        return (
          <div key={name} className="mb-4">
            <Label>{name}</Label>
            <Input
              type="text"
              onChange={(e) => handleChange(name, e.target.value)}
            />
          </div>
        );
    }
  };

  if (!schema.length) {
    return <p>Loading schema...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {schema.map((field) => renderField(field))}
      <Button type="submit">Submit</Button>
    </form>
  );
};

export default DynamicDIDForm;

export const CreateDIDPage: React.FC = () =>
{
  const didContextURL = "https://www.w3.org/ns/did/v1"; // URL to W3C DID context

  const handleSubmit = ( data: { [ key: string ]: any } ) =>
  {
    console.log( "Submitted Data:", data );
    // Add your logic for handling the submitted DID data
  };

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h1 className="text-xl font-semibold mb-4">Create a DID Credential</h1>
      <DynamicDIDForm context={didContextURL} onSubmit={handleSubmit} />
    </div>
  );
};