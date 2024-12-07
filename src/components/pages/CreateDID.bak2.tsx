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
  context: string[] | JSONLDContext; // Array of URLs or a single JSON-LD context object
  onSubmit: (formData: { [key: string]: any }) => void;
};

const DynamicDIDForm: React.FC<DynamicFormProps> = ({ context, onSubmit }) => {
  const [schema, setSchema] = useState<any[]>([]);
  const [formData, setFormData] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    const resolveContexts = async () => {
      try {
        let resolvedContexts: JSONLDContext[] = [];

        if (Array.isArray(context)) {
          // Fetch and resolve multiple contexts
          for (const ctx of context) {
            if (typeof ctx === "string") {
              const response = await axios.get(ctx);
              resolvedContexts.push(response.data["@context"] || response.data);
            } else {
              resolvedContexts.push(ctx["@context"] || ctx);
            }
          }
        } else {
          resolvedContexts.push(context["@context"] || context);
        }

        console.log("Resolved Contexts:", resolvedContexts);

        // Combine all contexts into one schema
        const combinedSchema = mergeSchemas(resolvedContexts);
        console.log("Combined Schema:", combinedSchema);

        setSchema(combinedSchema);
      } catch (error) {
        console.error("Failed to resolve JSON-LD contexts:", error);
      }
    };

    resolveContexts();
  }, [context]);

  const mergeSchemas = (contexts: JSONLDContext[]) => {
    const mergedSchema = {};
    contexts.forEach((ctx) => {
      Object.entries(ctx).forEach(([key, value]) => {
        mergedSchema[key] = value; // Later contexts override earlier ones
      });
    });
    return extractSchema(mergedSchema);
  };

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
          isArray: value["@container"] === "@set" || value["@container"] === "@list",
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

  const handleAddToArray = (key: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), {}],
    }));
  };

  const handleRemoveFromArray = (key: string, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key].filter((_: any, i: number) => i !== index),
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(formData);
  };

  const renderField = (field: any, index?: number, parentKey?: string) => {
    const { name, type, isArray } = field;
    const fullName = parentKey ? `${parentKey}.${name}` : name;

    if (isArray) {
      return (
        <div key={fullName} className="mb-4">
          <Label>{fullName}</Label>
          {(formData[fullName] || []).map((_: any, idx: number) => (
            <div key={`${fullName}.${idx}`} className="ml-4">
              {schema
                .filter((f: any) => f.name.startsWith(name))
                .map((subField: any) => renderField(subField, idx, fullName))}
              <Button size={"sm"} variant={"ghost"} onClick={() => handleRemoveFromArray(fullName, idx)}>
                Remove
              </Button>
            </div>
          ))}
          <Button size={"sm"} variant={"ghost"} onClick={() => handleAddToArray(fullName)}>Add</Button>
        </div>
      );
    }

    switch (type) {
      case "http://www.w3.org/2001/XMLSchema#string":
      case null: // Default to text input for undefined types
        return (
          <div key={fullName} className="mb-4">
            <Label>{fullName}</Label>
            <Input
              type="text"
              onChange={(e) => handleChange(fullName, e.target.value)}
            />
          </div>
        );
      default:
        return (
          <div key={fullName} className="mb-4">
            <Label>{fullName}</Label>
            <Input
              type="text"
              onChange={(e) => handleChange(fullName, e.target.value)}
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
      <DynamicDIDForm context={[
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/jws-2020/v1",
    "https://w3id.org/security/suites/ed25519-2020/v1"
  ]} onSubmit={handleSubmit} />
    </div>
  );
};