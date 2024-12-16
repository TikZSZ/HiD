async function fetchDidWeb(didWebUrl:string) {
  try {
    // Parse the DID:web URL into a usable format
    let didURL = didWebUrl.split("did:web:")[1]
    if(didURL.startsWith("https") || didURL.startsWith("http")){
      didURL = didURL.replace("https://","").replace("http://", "")
    }
    didURL = didURL.replace(/:/g, "/");
    console.log(didURL)
    // Fetch the DID document using the Web Fetch API
    const response = await fetch(`https://${didURL}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch DID document. HTTP status: ${response.status}`);
    }

    const didDocument = await response.json();

    console.log("DID Document:", didDocument);
    return didDocument;
  } catch (error) {
    console.error("Error fetching DID document:", error);
    throw error;
  }
}

// Example usage
const didWebUrl = "did:web:675d93dc69da7be75efd.appwrite.global/issuers/67562bf0002733ba9af0";

fetchDidWeb(didWebUrl).then(didDocument => {
  // Handle the DID document
  // console.log(JSON.stringify(didDocument, null, 2));
}).catch(err => {
  // Handle errors
  console.error("Failed to fetch DID document:", err);
});
