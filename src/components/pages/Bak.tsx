import React from "react";

type ContextField = {
  type: string;
  description?: string;
  required?: boolean;
  enum?: string[];
};

// type JSONLDContext = {
//   [ key: string ]: ContextField;
// };

// type DynamicFormProps = {
//   context: JSONLDContext;
//   onSubmit: ( formData: { [ key: string ]: any } ) => void;
// };

// const DynamicForm: React.FC<DynamicFormProps> = ( { context, onSubmit } ) =>
// {
//   const [ formData, setFormData ] = React.useState<{ [ key: string ]: any }>( {} );

//   const handleChange = ( key: string, value: any ) =>
//   {
//     setFormData( ( prev ) => ( { ...prev, [ key ]: value } ) );
//   };

//   const handleSubmit = ( event: React.FormEvent ) =>
//   {
//     event.preventDefault();
//     onSubmit( formData );
//   };

//   const renderField = ( key: string, field: ContextField ) =>
//   {
//     const { type, description, required, enum: enumValues } = field;

//     if ( enumValues )
//     {
//       return (
//         <div key={key}>
//           <label>
//             {key} {required && "*"}
//           </label>
//           <select
//             name={key}
//             required={required}
//             onChange={( e ) => handleChange( key, e.target.value )}
//           >
//             <option value="">Select...</option>
//             {enumValues.map( ( val ) => (
//               <option key={val} value={val}>
//                 {val}
//               </option>
//             ) )}
//           </select>
//           {description && <small>{description}</small>}
//         </div>
//       );
//     }

//     switch ( type )
//     {
//       case "string":
//         return (
//           <div key={key}>
//             <label>
//               {key} {required && "*"}
//             </label>
//             <input
//               type="text"
//               name={key}
//               required={required}
//               onChange={( e ) => handleChange( key, e.target.value )}
//             />
//             {description && <small>{description}</small>}
//           </div>
//         );
//       case "number":
//         return (
//           <div key={key}>
//             <label>
//               {key} {required && "*"}
//             </label>
//             <input
//               type="number"
//               name={key}
//               required={required}
//               onChange={( e ) => handleChange( key, e.target.value )}
//             />
//             {description && <small>{description}</small>}
//           </div>
//         );
//       case "boolean":
//         return (
//           <div key={key}>
//             <label>
//               {key} {required && "*"}
//             </label>
//             <input
//               type="checkbox"
//               name={key}
//               onChange={( e ) => handleChange( key, e.target.checked )}
//             />
//             {description && <small>{description}</small>}
//           </div>
//         );
//       case "date":
//         return (
//           <div key={key}>
//             <label>
//               {key} {required && "*"}
//             </label>
//             <input
//               type="date"
//               name={key}
//               required={required}
//               onChange={( e ) => handleChange( key, e.target.value )}
//             />
//             {description && <small>{description}</small>}
//           </div>
//         );
//       default:
//         return (
//           <div key={key}>
//             <label>{key}</label>
//             <input
//               type="text"
//               name={key}
//               onChange={( e ) => handleChange( key, e.target.value )}
//             />
//             {description && <small>{description}</small>}
//           </div>
//         );
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit}>
//       {Object.entries( context ).map( ( [ key, field ] ) =>
//         renderField( key, field as ContextField )
//       )}
//       <button type="submit">Submit</button>
//     </form>
//   );
// };

// export default DynamicForm;

import { useEffect, useState } from "react";
import axios from "axios";
import * as jsonld from "jsonld";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select,SelectTrigger,SelectContent,SelectValue,SelectItem } from "../ui/select";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
// import { Button, Input, Select, Checkbox, Label } from "@/components/ui/";



type JSONLDContext = {
  [key: string]: any;
};

type DynamicFormProps = {
  context: string | JSONLDContext; // URL to a JSON-LD context or the context object itself
  onSubmit: (formData: { [key: string]: any }) => void;
};


const DynamicDIDForm: React.FC<DynamicFormProps> = ({ context, onSubmit }) => {
  const [resolvedContext, setResolvedContext] = useState<JSONLDContext | null>(
    null
  );
  const [formData, setFormData] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    const resolveContext = async () => {
      try {
        let resolved: JSONLDContext;
        if (typeof context === "string") {
          // Fetch context if it's a URL
          const response = await axios.get(context);
          console.log(response.data)
          resolved = await jsonld.expand(response.data);
        } else {
          // Use the provided context directly
          resolved = await jsonld.expand(context);
        }
        setResolvedContext(resolved[0]); // JSON-LD expansion returns an array; take the first item
        console.log(resolved)
      } catch (error) {
        console.error("Failed to resolve JSON-LD context:", error);
      }
    };

    resolveContext();
  }, [context]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(formData);
  };

  const renderField = (key: string, field: any) => {
    const type = field["@type"]?.[0]; // JSON-LD uses arrays for types
    const description = field["http://schema.org/description"]?.[0]?.["@value"];
    const required = field["http://schema.org/isRequired"]?.[0]?.["@value"];

    if (field["@type"]?.includes("http://schema.org/Enumeration")) {
      const enumValues = field["http://schema.org/enumValues"]?.[0]?.["@list"];
      return (
        <div key={key} className="mb-4">
          <Label>
            {key} {required && "*"}
          </Label>
          <Select
            onValueChange={(value) => handleChange(key, value)}
            required={required}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {enumValues?.map((val: any) => (
                <SelectItem key={val["@value"]} value={val["@value"]}>
                  {val["@value"]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <small className="text-sm text-gray-600">{description}</small>}
        </div>
      );
    }

    switch (type) {
      case "http://www.w3.org/2001/XMLSchema#string":
        return (
          <div key={key} className="mb-4">
            <Label>
              {key} {required && "*"}
            </Label>
            <Input
              type="text"
              required={required}
              onChange={(e) => handleChange(key, e.target.value)}
            />
            {description && <small className="text-sm text-gray-600">{description}</small>}
          </div>
        );
      case "http://www.w3.org/2001/XMLSchema#boolean":
        return (
          <div key={key} className="mb-4">
            <Label>
              {key} {required && "*"}
            </Label>
            <Checkbox
              onCheckedChange={(checked) => handleChange(key, checked)}
            />
            {description && <small className="text-sm text-gray-600">{description}</small>}
          </div>
        );
      case "http://www.w3.org/2001/XMLSchema#date":
        return (
          <div key={key} className="mb-4">
            <Label>
              {key} {required && "*"}
            </Label>
            <Input
              type="date"
              required={required}
              onChange={(e) => handleChange(key, e.target.value)}
            />
            {description && <small className="text-sm text-gray-600">{description}</small>}
          </div>
        );
      default:
        return (
          <div key={key} className="mb-4">
            <Label>{key}</Label>
            <Input
              type="text"
              onChange={(e) => handleChange(key, e.target.value)}
            />
            {description && <small className="text-sm text-gray-600">{description}</small>}
          </div>
        );
    }
  };

  if (!resolvedContext) {
    return <p>Loading context...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {Object.entries(resolvedContext).map(([key, field]) =>
        renderField(key, field)
      )}
      <Button type="submit">Submit</Button>
    </form>
  );
};

export default DynamicDIDForm;


export const CreateDIDPage: React.FC = () =>
{
  const didContextURL = "https://www.w3.org/ns/did/v1"; // URL to W3C DID context

  const handleSubmit = (data: { [key: string]: any }) => {
    console.log("Submitted Data:", data);
  };

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h1 className="text-xl font-semibold mb-4">Create a DID Credential</h1>
      <DynamicDIDForm context={didContextURL} onSubmit={handleSubmit} />
    </div>
  );
  // const exampleContext = {
  //   name: {
  //     type: "string",
  //     description: "The name of the DID subject",
  //     required: true,
  //   },
  //   birthDate: {
  //     type: "date",
  //     description: "The birth date of the DID subject",
  //     required: false,
  //   },
  //   status: {
  //     type: "boolean",
  //     description: "Is the DID subject active?",
  //     required: true,
  //   },
  //   role: {
  //     type: "string",
  //     enum: ["admin", "user", "viewer"],
  //     description: "The role of the DID subject",
  //     required: true,
  //   },
  // };

  // const handleSubmit = (data: { [key: string]: any }) => {
  //   console.log("Submitted Data:", data);
  // };

  // return (
  //   <div>
  //     <h1>Create a DID Credential</h1>
  //     <DynamicDIDForm context={exampleContext} onSubmit={handleSubmit} />
  //   </div>
  // );
}