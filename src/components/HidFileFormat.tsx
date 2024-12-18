import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const HidDocumentation: React.FC = () => {
  const supportedTypes = [
    { 
      type: 'string', 
      description: 'Textual data (e.g., names, identifiers)',
      example: '"John Doe"'
    },
    { 
      type: 'number', 
      description: 'Numeric values (integers or decimals)',
      example: '42 or 3.14'
    },
    { 
      type: 'date', 
      description: 'Date values in ISO 8601 format',
      example: '"2024-12-31"'
    },
    { 
      type: 'enum', 
      description: 'Predefined set of allowed values',
      example: '"Full-Time", "Part-Time"'
    }
  ];

  return (
    <div className="container mx-auto  py-8">
      <h1 className="text-4xl font-bold mb-8 text-primary">
        HiD File Format Specification
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>File Structure Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple">
              <AccordionItem value="context">
                <AccordionTrigger>Context Section</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">
                    Defines the semantic context and namespaces for the credential.
                    The <code>@protected</code> flag ensures immutability of core definitions.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="type">
                <AccordionTrigger>Type Definition</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">
                    Specifies the type of credential (e.g., StudentCredential).
                    Used to categorize and identify the credential's purpose.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="fields">
                <AccordionTrigger>Fields Section</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">
                    Defines individual fields with their properties, types, and constraints.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supported Field Types</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Example</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supportedTypes.map((type, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge variant="secondary">{type.type}</Badge>
                    </TableCell>
                    <TableCell>{type.description}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {type.example}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <section className="mt-12">
        <h2 className="text-3xl font-semibold mb-6">Field Properties</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: 'name',
              description: 'Human-readable label for the field',
              usage: 'Provides a clear, user-friendly name for issuers and verifiers'
            },
            {
              name: 'description',
              description: 'Detailed explanation of the field\'s purpose',
              usage: 'Helps issuers understand the context and importance of the field'
            },
            {
              name: 'optional',
              description: 'Determines if a field can be left empty',
              usage: 'Controls whether a field must be populated when creating a Verifiable Credential'
            },
            {
              name: 'mandatory',
              description: 'Marks fields required for Selective Disclosure',
              usage: 'Ensures critical information is included in derived credentials'
            },
            {
              name: 'type',
              description: 'Specifies the data type of the field',
              usage: 'Enforces data validation and type checking'
            },
            {
              name: 'value',
              description: 'Predefined or default value for the field',
              usage: 'Can set default or static values for certain fields'
            }
          ].map((prop, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{prop.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {prop.description}
                </p>
                <div className="mt-2 text-sm text-secondary-foreground">
                  <strong>Usage:</strong> {prop.usage}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-12 bg-secondary/10 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Example HiD File</h2>
        <pre className="bg-secondary/20 p-4 rounded-md overflow-x-auto text-sm">
          {JSON.stringify({
            context: {
              "@protected": true,
              "StudentCredential": "urn:example:StudentCredential",
              "studentName": "https://schema.org#studentName"
            },
            type: "StudentCredential",
            fields: {
              studentName: {
                name: "Student Name",
                type: "string",
                optional: true,
                mandatory: false,
                description: "Full name of the student"
              }
            }
          }, null, 2)}
        </pre>
      </section>
    </div>
  );
};

export default HidDocumentation;