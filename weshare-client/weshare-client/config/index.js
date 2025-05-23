
// Get the API URL from environment variables
const API_URL = process.env.EXPO_PUBLIC_API_URL;
console.log("API_URL", API_URL);

export const config = {
    API_URL,
}; 