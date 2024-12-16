/*!
 * Copyright (c) 2023-2024 Digital Bazaar, Inc. All rights reserved.
 */
// eslint-disable-next-line max-len
const publicKeyMultibase = 'zUC76eySqgji6uNDaCrsWnmQnwq8pj1MZUDrRGc2BGRu61baZPKPFB7YpHawussp2YohcEMAeMVGHQ9JtKvjxgGTkYSMN53ZfCH4pZ6TGYLawvzy1wE54dS6PQcut9fxdHH32gi';
const secretKeyMultibase = 'z488x5kHU9aUe1weTqaf2sGFPgQS1HhunREFwB9bFeFwLch5';

export const controller = `did:key:${publicKeyMultibase}`;
const keyId = `${controller}#${publicKeyMultibase}`;


export const ecdsaController = "did:hedera:testnet:zDnaeWmwriNYv7jE3pVZZuyne4u7dUVghZpJTEQgeNVxEp7Sm"
export const ecdsaKeyId = `${ecdsaController}#root-key`
export const publicECDSAMultikey = {
  '@context': 'https://w3id.org/security/multikey/v1',
  type: 'Multikey',
  controller: ecdsaController,
  id: ecdsaKeyId,
  publicKeyMultibase: "zDnaeWmwriNYv7jE3pVZZuyne4u7dUVghZpJTEQgeNVxEp7Sm"
};

export const publicECDSAMultikeyKeyPair = {
  '@context': 'https://w3id.org/security/multikey/v1',
  type: 'Multikey',
  controller: ecdsaController,
  id: ecdsaKeyId,
  publicKeyMultibase: "zDnaeWmwriNYv7jE3pVZZuyne4u7dUVghZpJTEQgeNVxEp7Sm",
  secretKeyMultibase: "z42twRyBZDKeAsuhXFtMyUyUbSv7PuLxjcQEx9VD5nfKtjSV"
};

export const controllerDocECDSAMultikey = {
  '@context': [
    'https://www.w3.org/ns/did/v1',
    'https://w3id.org/security/multikey/v1'
  ],
  id: ecdsaController,
  assertionMethod: [ publicECDSAMultikey ]
};
export const bls12381MultikeyKeyPair = {
  '@context': 'https://w3id.org/security/multikey/v1',
  type: 'Multikey',
  controller,
  id: keyId,
  publicKeyMultibase,
  secretKeyMultibase
};

export const publicBls12381Multikey = {
  '@context': 'https://w3id.org/security/multikey/v1',
  type: 'Multikey',
  controller,
  id: keyId,
  publicKeyMultibase
};

export const controllerDocBls12381Multikey = {
  '@context': [
    'https://www.w3.org/ns/did/v1',
    'https://w3id.org/security/multikey/v1'
  ],
  id: controller,
  assertionMethod: [ publicBls12381Multikey ]
};

// https://blabla/issuers/2564515/keys/51256112
export const customCredential = {
  "@context": [
    "https://www.w3.org/ns/credentials/v2",
    "https://www.w3.org/ns/credentials/examples/v2",
    {
      "@protected": true,
      "GreenFinanceCredential": "urn:example:GreenFinanceCredential",
      "projectName": "https://schema.org#projectName",
      "fundingAmount": "https://schema.org#fundingAmount",
      "carbonReduction": "https://schema.org#carbonReduction",
      "certificationBody": "https://schema.org#certificationBody",
      "vCRR": "https://schema.org#vCRR",
      "DataIntegrityCredentiale": "urn:example:DataIntegrityCredentiale",
      "dataSources": "https://schema.org#dataSources",
      "dataHash": "https://schema.org#dataHash",
      "iCRR": "https://schema.org#iCRR",
      "statuss": "https://schema.org#statuss"
    }
  ],
  "id": "urn:uuid:98c5cffc-efa2-43e3-99f5-01e8ef404be0",
  "type": [
    "VerifiableCredential",
    "GreenFinanceCredential"
  ],
  "issuer": {
    "id": controller,
    "name": "something institute"
  },
  "issuanceDate": "2024-12-16T08:13:49.311Z",
  "credentialSubject": {
    "id": "did:hedera:testnet:z9qd1bB7ABC5mccHe3Chas1VDQusYc79ttDAsRRVA7MXm_0.0.5229786",
    "projectName": "Green Incentives 2024",
    "fundingAmount": "12313",
    "carbonReduction": "231",
    "certificationBody": "Department Of Green Energy",
    "vCRR": "asdasd",
    "dataSources": "asdsad",
    "dataHash": "adasd",
    "iCRR": "asdad",
    "statuss": "sdas"
  }
}
export const alumniCredential = {
  '@context': [
    'https://www.w3.org/ns/credentials/v2',
    {
      '@protected': true,
      AlumniCredential: 'urn:example:AlumniCredential',
      alumniOf: 'https://schema.org#alumniOf'
    },
    'https://w3id.org/security/data-integrity/v2'
  ],
  id: 'urn:uuid:98c5cffc-efa2-43e3-99f5-01e8ef404be0',
  type: [ 'VerifiableCredential', 'AlumniCredential' ],
  issuer: {
    id: controller,
    name: "something institute"
  },
  issuanceDate: '2010-01-01T19:23:24Z',
  credentialSubject: {
    id: 'did:hedera:testnet:z9qd1bB7ABC5mccHe3Chas1VDQusYc79ttDAsRRVA7MXm_0.0.5263305',
    alumniOf: 'Example University'
  }
};

export const dlCredential = {
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    {
      '@protected': true,
      DriverLicenseCredential: 'urn:example:DriverLicenseCredential',
      DriverLicense: {
        '@id': 'urn:example:DriverLicense',
        '@context': {
          '@protected': true,
          id: '@id',
          type: '@type',
          documentIdentifier: 'urn:example:documentIdentifier',
          dateOfBirth: 'urn:example:dateOfBirth',
          expirationDate: 'urn:example:expiration',
          issuingAuthority: 'urn:example:issuingAuthority'
        }
      },
      driverLicense: {
        '@id': 'urn:example:driverLicense',
        '@type': '@id'
      }
    },
    'https://w3id.org/security/data-integrity/v2'
  ],
  id: 'urn:uuid:36245ee9-9074-4b05-a777-febff2e69757',
  type: [ 'VerifiableCredential', 'DriverLicenseCredential' ],
  issuer: controller,
  issuanceDate: '2010-01-01T19:23:24Z',
  credentialSubject: {
    id: 'urn:uuid:1a0e4ef5-091f-4060-842e-18e519ab9440',
    driverLicense: {
      type: 'DriverLicense',
      documentIdentifier: 'T21387yc328c7y32h23f23',
      dateOfBirth: '01-01-1990',
      expirationDate: '01-01-2030',
      issuingAuthority: 'VA'
    }
  }
};

export const dlCredentialNoIds = {
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    {
      '@protected': true,
      DriverLicenseCredential: 'urn:example:DriverLicenseCredential',
      DriverLicense: {
        '@id': 'urn:example:DriverLicense',
        '@context': {
          '@protected': true,
          id: '@id',
          type: '@type',
          documentIdentifier: 'urn:example:documentIdentifier',
          dateOfBirth: 'urn:example:dateOfBirth',
          expirationDate: 'urn:example:expiration',
          issuingAuthority: 'urn:example:issuingAuthority'
        }
      },
      driverLicense: {
        '@id': 'urn:example:driverLicense',
        '@type': '@id'
      }
    },
    'https://w3id.org/security/data-integrity/v2'
  ],
  type: [ 'VerifiableCredential', 'DriverLicenseCredential' ],
  issuer: controller,
  issuanceDate: '2010-01-01T19:23:24Z',
  credentialSubject: {
    driverLicense: {
      type: 'DriverLicense',
      documentIdentifier: 'T21387yc328c7y32h23f23',
      dateOfBirth: '01-01-1990',
      expirationDate: '01-01-2030',
      issuingAuthority: 'VA'
    }
  }
};

export const employeeCredential = {
  '@context': [
    'https://www.w3.org/ns/credentials/v2',
    'https://www.w3.org/ns/credentials/examples/v2'
  ],
  type: [ 'VerifiableCredential', 'ExampleEmployeeCredential' ],
  issuer: 'did:example:c276e12ec21ebfeb1f712ebc6f1',
  validFrom: '2023-06-01T09:25:48Z',
  validUntil: '2024-06-01T09:25:48Z',
  credentialSubject: {
    id: 'did:example:ebfeb1f712ebc6f1c276e12ec21',
    name: 'Jane Doe',
    employeeId: 'YB-38473',
    jobTitle: 'Comptroller',
    division: 'Accounting',
    employer: {
      id: 'did:example:c276e12ec21ebfeb1f712ebc6f1',
      name: 'Example Corporation'
    }
  }
};

export const achievementCredential = {
  '@context': [
    'https://www.w3.org/ns/credentials/v2',
    'https://www.w3.org/ns/credentials/examples/v2'
  ],
  type: [ 'VerifiableCredential', 'ExampleAchievementCredential' ],
  issuer: 'did:example:c276e12ec21ebfeb1f712ebc6f1',
  // validFrom: '2023-06-01T09:25:48Z',
  // validUntil: '2024-16-12T09:25:48Z',
  credentialSubject: {
    name: 'Jane Doe',
    achievements: [ {
      type: 'WindsailingAchievement',
      sailNumber: 'Earth101',
      sails: [
        {
          size: 5.5,
          sailName: 'Osprey',
          year: 2023
        },
        {
          size: 6.1,
          sailName: 'Eagle-FR',
          year: 2023
        },
        {
          size: 7.0,
          sailName: 'Eagle-FR',
          year: 2020
        },
        {
          size: 7.8,
          sailName: 'Eagle-FR',
          year: 2023
        }
      ],
      boards: [
        {
          boardName: 'CompFoil170',
          brand: 'Tillo',
          year: 2022
        },
        {
          boardName: 'Tillo Custom',
          brand: 'Tillo',
          year: 2019
        }
      ]
    },
    {
      type: 'WindsailingAchievement',
      sailNumber: 'Mars101',
      sails: [
        {
          size: 5.9,
          sailName: 'Chicken',
          year: 2022
        },
        {
          size: 4.9,
          sailName: 'Vulture-FR',
          year: 2023
        },
        {
          size: 6.8,
          sailName: 'Vulture-FR',
          year: 2020
        },
        {
          size: 7.7,
          sailName: 'Vulture-FR',
          year: 2023
        }
      ],
      boards: [
        {
          boardName: 'Oak620',
          brand: 'Excite',
          year: 2020
        },
        {
          boardName: 'Excite Custom',
          brand: 'Excite',
          year: 2018
        }
      ]
    } ]
  }
};

// example HMAC key to use for test vectors
export const hmacKey = new Uint8Array( 32 );
// set bookends to 1 to make the key easy to spot in test data
hmacKey[ 0 ] = 1;
hmacKey[ 31 ] = 1;