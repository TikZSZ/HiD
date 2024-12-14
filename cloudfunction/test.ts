import dotenv from 'dotenv';
import fetchOrgKeysFunction from './index'; // Replace with your function's filename

dotenv.config();

// Mock request and response objects
const mockRequest = {
  payload: JSON.stringify({ orgId: '67562bf0002733ba9af0' }),
  query:{
    orgId:"67562bf0002733ba9af0"
  }
};

const mockResponse = {
  status: (code) => {
    console.log(`Status: ${code}`);
    return mockResponse;
  },
  json: (data) => {
    // console.log('Response:', JSON.stringify(data, null, 2));
  },
};

// Invoke the cloud function
(async () => {
  try {
    await fetchOrgKeysFunction(mockRequest, mockResponse);
  } catch (error) {
    console.error('Error:', error);
  }
})();
