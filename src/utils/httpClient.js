import axios from 'axios';

const httpClient = axios.create({
    baseURL: process.env.API_BASE_URL, // Base URL for the API
    timeout: 10000, // Request timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor for handling responses
httpClient.interceptors.response.use(
    response => response,
    error => {
        // Handle errors globally
        if (error.response) {
            console.error('API Error:', error.response.data);
        } else {
            console.error('Network Error:', error.message);
        }
        return Promise.reject(error);
    }
);

export default httpClient;