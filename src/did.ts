// hedera sdk is CommonJS and won't be transpiled properly if not "required".
/* eslint-disable @typescript-eslint/no-var-requires */
import { PrivateKey, Client,Signer } from "@hashgraph/sdk"
import { DidDocument, HcsDid } from "@/HiD/did-sdk/index";
// import hederaClient from "./hedera";


interface CreateDidParams {
  privateKey: typeof PrivateKey;
  signer: typeof Signer;
}

export async function loadDidDocument(documentId: string) {
  const didDocument = new HcsDid({
    identifier: documentId,
    // client: hederaClient
  });

  const resolvedDocument = await didDocument.resolve();

  if (!isValidDidDocument(resolvedDocument)) {
    throw new Error(`Unable to resolve DID Document with id ${documentId}`);
  }

  return resolvedDocument;
}

export function createDidDocument(params: CreateDidParams) {
  return new HcsDid(params as any);
}

export function registerDidDocument(document: HcsDid) {
  return document.register();
}

function isValidDidDocument(didDocument: DidDocument) {
  return Boolean(didDocument.getVersionId());
}
