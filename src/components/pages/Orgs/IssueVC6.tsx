import React, { useState, useCallback, useMemo, useEffect } from "react";
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
// @ts-ignore
import {binary_to_base58} from "base58-js"
interface ImportedContext
{
  context: { [ key: string ]: string };
  type: string;
  fields: {
    [ key: string ]: {
      name: string;
      type: string;
      optional?: boolean;
      description?: string;
      value?:any
      mandatory?:boolean
    }
  };
}
// Icons
import
{
  Plus,
  Trash2,
  ShieldCheck,
  FileUp,
  Calendar as CalendarIcon
} from "lucide-react";

// Services and Contexts
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";
import { useKeyContext } from "@/contexts/keyManagerCtx";
import { useParams } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { keyTypesColors } from "@/components/OrganizationTable";
// Enhanced Zod Schema for VC Creation with Dynamic Field Support

// Dynamic Input Component
const DynamicInput: React.FC<{
  dataType: string;
  value: any;
  onChange: ( value: any ) => void;
  placeholder?: string;
  field?: any
}> = ( { dataType, value, onChange, placeholder, field } ) =>
  {
    {
      console.log( field )
      switch ( dataType )
      {
        case 'date':
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
                  {value ? format( value, "PPP" ) : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={value}
                  onSelect={onChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          );
        case 'number':
          return (
            // <div className="grid w-full max-w-sm items-center gap-1.5">
            //   <Label htmlFor="email">Email</Label>
            //   <Input type="number" value={value || ''} onChange={( e ) => onChange( Number( e.target.value ) )} placeholder={placeholder} />
            // </div>
            <FormItem>
              <FormLabel>{field.key}</FormLabel>
              <FormControl>
                <Input type="number" placeholder={placeholder} />
              </FormControl>
              <FormDescription>
                {field.description}
              </FormDescription>
            </FormItem>
            // <Input
            //   type="number"
            //   value={value || ''}
            //   onChange={( e ) => onChange( Number( e.target.value ) )}
            //   placeholder={placeholder}
            // />
          );
        case 'boolean':
          return (
            <Checkbox
              checked={value || false}
              onCheckedChange={onChange}
            />
          );
        default:
          return (
            // <Input
            //   value={value || ''}
            //   onChange={( e ) => onChange( e.target.value )}
            //   placeholder={placeholder}
            // />
            <FormItem>
              <FormLabel>{field.key}</FormLabel>
              <FormControl>
                <Input value={value || ''} onChange={( e ) => onChange( e.target.value )} placeholder={placeholder} required={!field.optional} />
              </FormControl>
              <FormDescription>
                {field.description}
              </FormDescription>
            </FormItem>
          );
      }
    };
  }

const DynamicInput2: React.FC<{ field: any, fieldName: string, fieldDescription?: string, dataType: string, required: boolean }> = ( { field, dataType, fieldName, fieldDescription = "", required } ) =>
{
  // console.log( field )
  {
    // console.log(field )
    switch ( dataType )
    {
      case 'date':
        return (
          <div>
            <FormItem>
              <FormLabel>{fieldName}</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  required={required}
                />
              </FormControl>
              <FormDescription>
                {fieldDescription}
              </FormDescription>
            </FormItem>
          </div>


        );
      case 'number':
        return (
          <FormItem>
            <FormLabel>{fieldName}</FormLabel>
            <FormControl>
              <Input type="number" {...field} required={required} />
            </FormControl>
            <FormDescription>
              {fieldDescription}
            </FormDescription>
          </FormItem>
        );
      case 'boolean':
        return (
          // <Checkbox checked={field.value}
          //   onCheckedChange={( e ) =>
          //   {
          //     field.value = e
          //   }} />
          <div>
            <Switch checked={field.value} onCheckedChange={field.onChange} id="airplane" />
            <Label htmlFor="airplane">Mandatory</Label>
          </div>

        );
      default:
        return (
          <FormItem>
            <FormLabel>{fieldName}</FormLabel>
            <FormControl>
              <Input {...field} required={required} />
            </FormControl>
            <FormDescription>
              {fieldDescription}
            </FormDescription>
          </FormItem>
        );
    }
  };
}

const VCCreationSchema = z.object( {
  // name: z.string().nonempty( "Name is required" ),
  // description: z.string().nonempty( "Name is required" ),
  identifier: z.string().refine( ( identifier ) =>
  {
    if ( identifier.split( ":" ).length !== 4 ) return false
    if ( identifier.split( ":" )[ 3 ].split( "_" ).length !== 2 ) return false
    if ( identifier.split( ":" )[ 3 ].split( "_" )[ 1 ].split( "." ).length !== 3 ) return false
    return true
  }, "identifier should be of form did:hedera:network:....._TopicID " ).default(""),
  keyId: z.string().nonempty( "Select a key to sign the credential" ),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),

  // subject: z.object( {
  //   id: z.string().optional(),
  //   name: z.string().optional()
  // } ).optional(),

  contexts: z.array(
    z.object( {
      type: z.string(),
      context: z.record( z.string(), z.any() ),
      originalFile: z.string().optional(),
      schema: z.record( z.string(), z.object( {
        name:z.string(),
        mandatory: z.boolean().default( false ).optional(),
        type: z.string(),
        description: z.string().optional()
      } ) ).optional()
    } )
  ).default( [] ),

  credentialSubject: z.array(
    z.object( {
      key: z.string().nonempty( "Key is required" ),
      value: z.string().or( z.number() ).or( z.date() ).optional(),
      mandatory: z.boolean().default( false ),
      optional: z.boolean().optional(),
      name: z.string(),
      description: z.string().optional(),
      contextRef: z.string().optional(),
      dataType: z.string().optional()
    } )
  ).default( [] )
} );
interface CreateVCModalProps
{
  isOpen: boolean;
  onOpenChange: ( open: boolean ) => void;
  onSubmit: ( data: z.infer<typeof VCCreationSchema> ) => void;
}
export const CreateVCModal: React.FC<CreateVCModalProps> = ( {
  isOpen,
  onOpenChange,
  onSubmit
} ) =>
{
  const { orgId } = useParams<{ orgId: string }>();
  const { userId, useOrgsList } = useKeyContext();
  const {
    data: keys = [],
    isLoading: isLoadingKeys
  } = useQuery( {
    queryKey: [ 'memberKeys', orgId ],
    queryFn: () => AppwriteService.getKeysForOrgAndUser( userId, orgId! ),
    enabled: isOpen
  } );
  // Form Setup with more robust default values
  const form = useForm<z.infer<typeof VCCreationSchema>>( {
    resolver: zodResolver( VCCreationSchema ),
    defaultValues: {
      // name: "",
      // description: "",
      identifier:'',
      contexts: [],
      credentialSubject: [],
      validFrom:undefined,
      validUntil:undefined
    },
  } );

  const {
    fields: subjectFields,
    append: appendSubjectField,
    remove: removeSubjectField
  } = useFieldArray( {
    control: form.control,
    name: "credentialSubject"
  } );

  const {
    fields: contextsFields,
    append: appendContext,
    remove: removeContext
  } = useFieldArray( {
    control: form.control,
    name: "contexts"
  } );

  async function addJSONContext ( jsonStr: string, file: any = { name: 'default.json' } )
  {
    try
    {
      const textEncoder = new TextEncoder()
      const hash = file.name+"#"+(binary_to_base58(new Uint8Array(await crypto.subtle.digest("SHA-256",textEncoder.encode(jsonStr)))) as string).substring(0,15)
      if(contextsFields.find((cont)=>cont.originalFile === hash)){
        toast( {
          title: "Duplicate Context",
          description: "The imported context already exists.",
          variant: "destructive"
        } );
        return;
      }
      const parsedContext = JSON.parse( jsonStr ) as ImportedContext;

      if ( !parsedContext.context || !parsedContext.fields )
      {
        toast( {
          title: "Invalid Context",
          description: "The imported context is missing required fields.",
          variant: "destructive"
        } );
        return;
      }

      // Determine context type and schema
      const contextType = parsedContext.type || file.name.replace( '.json', '' );
      const contextSchema = Object.entries( parsedContext.fields ).reduce(
        ( acc, [ key, details ] ) => ( {
          ...acc,
          [ key ]: {
            name: details.name || key,
            mandatory: details.mandatory || false,
            type: details.type || 'string',
            description: details.description || ''
          }
        } ),
        {} as ImportedContext[ "fields" ]
      );
      console.log( contextType, contextSchema )
      
      // Add context to contexts array with schema
      appendContext( {

        type: contextType,
        context: parsedContext.context,
        originalFile:hash,
        schema: contextSchema
      } );

      // Add fields to credentialSubject
      Object.entries( parsedContext.fields ).forEach( ( [ key, details ] ) =>
      {
        const existingField = form.watch( "credentialSubject" )
          .find( field => field.key === key );

        if ( !existingField )
        {
          appendSubjectField( {
            key,
            value: details.value || "",
            mandatory: details.mandatory || false,
            optional: details.optional,
            contextRef: contextType,
            dataType: details.type || 'string',
            description: details.description,
            name: details.name
          } );
        }
      } );

      toast( {
        title: "Context Imported",
        description: `Context from ${file.name} added successfully.`
      } );
    } catch ( error )
    {
      toast( {
        title: "Import Failed",
        description: "Could not parse the context file. Please check the format.",
        variant: "destructive"
      } );
    }
  }

//   useEffect( () =>
//   {
//     addJSONContext( `{
//   "context": {
//     "@protected": true,
//     "AlumniCredential": "urn:example:AlumniCredential",
//     "alumniOf": "https://schema.org#alumniOf",
//     "currentGrade": "https://schema.org#number",
//     "graduationDate": "https://schema.org#date"
//   },
//   "type": "AlumniCredential",
//   "fields": {
//     "alumniOf": {
//       "name":"Alumni Of",
//       "type":"string",
//       "optional":false,
//       "mandatory":true,
//       "description":"University Name"
//     }, 
//     "currentGrade": {
//       "name":"Current Grade",
//       "type":"number",
//       "optional":false,
//       "mandatory":true,
//       "description":"Current Student Grade"
//     }, 
//     "graduationDate": {
//       "name":"Graduation Date",
//       "type":"date",
//       "optional":false,
//       "mandatory":true,
//       "description":"Current Student Graduation Date"
//     }
//   }
// }`)
//   }, [] )

  // Enhanced File Drop Handler
  
  const onDrop = useCallback( ( acceptedFiles: File[] ) =>
  {
    acceptedFiles.forEach( file =>
    {
      const reader = new FileReader();

      reader.onload = ( event ) =>
      {
        // @ts-ignore
        addJSONContext( event.target.result,file )
      };

      reader.readAsText( file );
    } );
  }, [ appendContext, appendSubjectField, form ] );

  // Dropzone setup
  const { getRootProps, getInputProps, isDragActive } = useDropzone( {
    onDrop,
    accept: {
      'application/json': [ '.json' ]
    },
    multiple: true
  } );

  // Improved Context Removal
  const removeContextAndFields = ( contextIndex: number ) =>
  {
    const contextToRemove = form.watch( "contexts" )[ contextIndex ];

    // Remove only fields associated with this specific context
    const updatedSubjectFields = form.watch( "credentialSubject" ).filter(
      field => field.contextRef !== contextToRemove.type
    );
    console.log( { updatedSubjectFields } )
    // Update form values
    form.setValue( "credentialSubject", updatedSubjectFields );
    removeContext( contextIndex );
  };

  const handleSubmit = ( data: z.infer<typeof VCCreationSchema> ) =>
  {
    onSubmit( {
      ...data,
      // Additional processing if needed
    } );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl overflow-auto max-h-[90%]">
        <DialogHeader>
          <DialogTitle>Create Verifiable Credential</DialogTitle>
          <DialogDescription>
            Configure and issue a new Verifiable Credential
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit( handleSubmit )} className="space-y-6 overflow-auto">
            {/* Restore all original form sections from the previous implementation */}
            {/* VC Metadata Card */}

            {/* <Card>
              <CardHeader>
                <CardTitle>Credential Metadata</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={( { field } ) => (
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
                  render={( { field } ) => (
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
            </Card> */}

            {/* Validity Periods */}
            <Card>
              <CardHeader>
                <CardTitle>Validity Period</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="validFrom"
                  render={( { field } ) => (
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
                  render={( { field } ) => (
                    <FormItem>
                      <FormLabel>Valid Until</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                        
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
                  name="identifier"
                  control={form.control}
                  render={( { field } ) => (
                    <FormItem>
                      <FormLabel>Credential Identifier</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter unique identifier" {...field} />
                        {/* {didDocument?.toJSON()} */}
                      </FormControl>
                      <FormDescription>
                        Decentralized Identifier for the subject
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Key Selection */}
                <FormField
                  name="keyId"
                  control={form.control}
                  render={( { field } ) => (
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
                          {keys.map( ( key ) => (
                            <SelectItem key={key.$id} value={key.$id}>
                              {key.name} {key.keyType.map( ( keyType ) => (
                                <Badge key={keyType} className={keyTypesColors[ keyType ] + " mx-1"}>
                                  {keyType}
                                </Badge>
                              ) )}
                            </SelectItem>
                          ) )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The key that will be used to cryptographically sign this credential
                      </FormDescription>
                      <FormMessage />
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
                  {contextsFields.map( ( context, index ) => (
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
                        onClick={() => removeContextAndFields( index )}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) )}
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
              <CardContent className="grid grid-cols-1 gap- overflow-auto">
                {subjectFields.map( ( field, index ) => (
                  <div
                    key={field.id}
                    className="flex items-center space-x-2 mb-2"
                  >
                    {/* <Input
                      placeholder="Property Key"
                      value={field.key}
                      disabled
                    /> */}
                    {/* <DynamicInput
                      dataType={field.dataType || 'string'}
                      value={form.watch( `credentialSubject.${index}.value` )}
                      onChange={( value ) =>
                      {
                        form.setValue( `credentialSubject.${index}.value`, value );
                      }}
                      placeholder={`Enter ${field.key}`}
                      field={field}
                    /> */}
                    <FormField
                      control={form.control}
                      name={`credentialSubject.${index}.value`}
                      rules={{ required: !field.optional }}
                      render={( { field: field2 } ) => (
                        <DynamicInput2
                          dataType={field.dataType || 'string'}
                          field={field2}
                          fieldName={field.name}
                          fieldDescription={field.description}
                          required={!field.optional}
                        />
                      )}
                    />

                    <Controller
                      name={`credentialSubject.${index}.mandatory`}
                      control={form.control}
                      render={( { field: checkboxField } ) => (
                        // <Checkbox
                        //   checked={checkboxField.value}
                        //   onCheckedChange={checkboxField.onChange}
                        // />
                        <div className="items-top flex space-x-2">
                          {/* <div className="grid gap-1.5 leading-none"> */}
                          {/* <label
                              htmlFor="terms1"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Mandatory
                            </label> */}
                          <div className="flex items-center space-x-2">
                            <Switch checked={checkboxField.value} onCheckedChange={checkboxField.onChange} id="airplane-mode" />
                            <Label htmlFor="airplane-mode">Mandatory</Label>
                          </div>
                          {/* </div> */}
                        </div>
                      )}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeSubjectField( index )}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) )}
              </CardContent>
            </Card>
            {form.formState.errors.root && (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}
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