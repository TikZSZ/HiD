import
{
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

import
{
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";

import React, { useState } from 'react';
import { ClipboardPaste, Copy, Icon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import HidDocumentation from "../HidFileFormat";

export const DIDIdentifier: React.FC = () =>
{
  const [ orgId, setOrgId ] = useState( '' );
  const [ formattedDID, setFormattedDID ] = useState( '' );

  const handleGenerate = () =>
  {
    if ( orgId.trim() )
    {
      const didIdentifier = `did:web:675d93dc69da7be75efd.appwrite.global/issuers/${orgId}`;
      setFormattedDID( didIdentifier );
    }
  };

  const handleCopy = () =>
  {
    if ( formattedDID )
    {
      navigator.clipboard.writeText( formattedDID );
      toast( {
        title: "Copied to Clipboard",
        description: "DID Identifier has been copied",
      } );
    }
  };

  const handlePaste = async () =>
  {
    try
    {
      const pastedText = await navigator.clipboard.readText();
      setOrgId( pastedText.trim() );
    } catch ( err )
    {
      toast( {
        title: "Paste Error",
        description: "Could not paste from clipboard",
        variant: "destructive"
      } );
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>DID Identifier Generator</CardTitle>
        <CardDescription>Generate your Decentralized Identifier</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Input
            placeholder="Enter Organization ID"
            value={orgId}
            onChange={( e ) => setOrgId( e.target.value )}
            className="flex-grow"
          />
          <Button variant="outline" size="icon" onClick={handlePaste}>
            <ClipboardPaste className="h-4 w-4" />
          </Button>
          <Button onClick={handleGenerate}>Generate</Button>
        </div>

        {formattedDID && (
          <div className="flex items-center space-x-4">
            <div className="flex-grow bg-secondary/50 p-2 rounded-md text-sm font-mono break-all">
              {formattedDID}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="hover:bg-primary/10"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const DocumentationPage: React.FC = () =>
{
  const documentationSections = [
    {
      title: "Decentralized Identifiers",
      description: "Unique identifiers that enable verifiable, decentralized digital identity. Our platform provides robust DID generation and management."
    },
    {
      title: "Verifiable Credentials",
      description: "Cryptographically secure, machine-verifiable credentials that provide a standardized way to express credentials on the web."
    },
    {
      title: "Trust Mechanism",
      description: "Establish trust through a comprehensive verification process that ensures the integrity of digital identities and credentials."
    },
    {
      title: "Security Protocols",
      description: "Advanced security measures including encryption, signatures, and multi-factor authentication to protect digital identities."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="gap-8 flex flex-col mb-12">

          <div>
            {/* <h1 className="text-4xl font-bold mb-4 text-primary">
              HiD
            </h1> */}
            <p className="text-muted-foreground mb-6">
              A comprehensive platform for managing Verifiable Credentials and Decentralized Identifiers
            </p>
            <Accordion type="multiple" className="w-full">
              {documentationSections.map( ( section, index ) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger>{section.title}</AccordionTrigger>
                  <AccordionContent>
                    {section.description}
                  </AccordionContent>
                </AccordionItem>
              ) )}
            </Accordion>
          </div>


        </div>
        <div>
          <DIDIdentifier />
        </div>
        <HidDocumentation />
        {/* <section className="grid md:grid-cols-2 gap-6">
          {[
            {
              title: "Quick Integration",
              description: "Seamlessly integrate our DID platform into your existing infrastructure with minimal configuration."
            },
            {
              title: "Cross-Platform Support",
              description: "Compatible with multiple blockchain networks and identity protocols."
            }
          ].map( ( feature, index ) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ) )}
        </section> */}
      </main>
    </div>
  );
};

export default DocumentationPage;