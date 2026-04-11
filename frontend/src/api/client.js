// src/api/client.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const client = axios.create({
  baseURL: API_URL,
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests (nanti)
client.interceptors.request.use(
  (config) => {
    // TODO: Add token here later
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors (nanti)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // TODO: Handle errors here
    return Promise.reject(error);
  }
);

export default client;
