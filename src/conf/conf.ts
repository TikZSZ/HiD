// import dotenv from "dotenv"
// dotenv.config()
const [dids,users,keys,orgs,roles,vcs,vcStores,vps,contexts] = String(import.meta.env["VITE_APPWRITE_COLLECTION_ID"]).split(",")

export const conf = {
  appwriteEndpoint:String(import.meta.env["VITE_APPWRITE_ENDPOINT"]),
  appwrtieProjectId:String(import.meta.env["VITE_APPWRITE_PROJECT_ID"]),
  appwrtieDBId:String(import.meta.env["VITE_APPWRITE_DATABASE_ID"]),
  // appwriteCollectionId:String(import.meta.env["VITE_APPWRITE_COLLECTION_ID"]),
  appwriteDIDsCollID:dids,
  appwriteUsersCollID:users,
  appwriteKeysCollID:keys,
  appwriteOrgsCollID:orgs,
  appwriteRolesCollID:roles,
  appwriteVCsCollID:vcs,
  appwriteVCStoresCollID:vcStores,
  appwriteVPsCollID:vps,
  appwriteContextsCollID:contexts,
  appwriteBucketId:String(import.meta.env["VITE_APPWRITE_BUCKET_ID"]),
  appwriteFunctionId:String(import.meta.env["VITE_APPWRITE_FUNCTION_ID"])
}