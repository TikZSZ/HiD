

import jsonld from "jsonld"
import axios from "axios"
type JSONLDContext = {
  [key: string]: any;
};
import {ContextParser,FetchDocumentLoader} from "jsonld-context-parser"

const myParser = new ContextParser({
  documentLoader: new FetchDocumentLoader(),
  skipValidation: true,
  expandContentTypeToBase: true,
});

const myContext = await myParser.parse('https://www.w3.org/ns/did/v1',{});

// console.log(myContext.getContextRaw(),{})
import canonize  from "rdf-canonize"
import {toRDF,normalize} from "jsonld"
const doc = {
  "@context": [
    {"myWebsite": "https://vocabulary.example/myWebsite"},
    "https://www.w3.org/ns/credentials/v2"
  ],
  "myWebsite": "https://hello.world.example/",
  "proof": {
    "type": "DataIntegrityProof",
    "cryptosuite": "eddsa-rdfc-2022",
    "created": "2023-02-24T23:36:38Z",
    "verificationMethod": "https://vc.example/issuers/5678#z6MkrJVnaZkeFzdQyMZu1cgjg7k1pZZ6pvBQ7XJPt4swbTQ2",
    "proofPurpose": "assertionMethod",
    "proofValue": "z5C5b1uzYJN6pDR3aWgAqUMoSB1JY29epA74qyjaie9qh4okm9DZP6y77eTNq5NfYyMwNu9bpQQWUHKH5zAmEtszK"
  }
}
const doc2 = {
  "@context": [
    "https://www.w3.org/ns/credentials/v2",
    "https://www.w3.org/ns/credentials/examples/v2"
  ],
  "id": "http://university.example/credentials/58473",
  "type": ["VerifiableCredential", "ExampleAlumniCredential"],
  "issuer": "did:example:2g55q912ec3476eba2l9812ecbfe",
  "validFrom": "2010-01-01T00:00:00Z",
  "credentialSubject": {
    "id": "did:example:ebfeb1f712ebc6f1c276e12ec21",
    "alumniOf": {
      "id": "did:example:c276e12ec21ebfeb1f712ebc6f1",
      "name": "Example University"
    }
  }
}
const rdfTriples = await toRDF(doc2)
console.log(rdfTriples,{depth:Infinity})
const canonical = await canonize.canonize(rdfTriples, {algorithm: 'RDFC-1.0',});
console.log(canonical)
// const resolveContext = async (context:string|object) => {
//   try {
//     let resolved: JSONLDContext;
//     if (typeof context === "string") {
//       // Fetch context if it's a URL
//       const response = await axios.get(context);
//       // console.log(response.data)
//       resolved = await jsonld.expand(response.data);
//     } else {
//       // Use the provided context directly
//       resolved = await jsonld.expand(context);
//     }
//    // JSON-LD expansion returns an array; take the first item
//     console.log(resolved)
//   } catch (error) {
//     console.error("Failed to resolve JSON-LD context:", error);
//   }
// };

// resolveContext("https://www.w3.org/ns/did/v1")