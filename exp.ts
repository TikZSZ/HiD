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

console.log(myContext.getContextRaw(),{})

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