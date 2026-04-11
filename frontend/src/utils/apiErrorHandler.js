export const handleApiError = (error) => {  
  console.error('API Error:', error);  

  if (error?.response?.status === 401) {  
    return 'Unauthorized. Please login again.';  
  }  

  if (error?.response?.status === 403) {  
    return 'You do not have permission to do this.';  
  }  

  if (error?.response?.status === 404) {  
    return 'Resource not found.';  
  }  

  if (error?.response?.status === 409) {  
    return 'This resource already exists.';  
  }  

  if (error?.response?.status >= 500) {  
    return 'Server error. Please try again later.';  
  }  

  if (error?.response?.data?.message) {  
    return error.response.data.message;  
  }  

  if (error?.message) {  
    return error.message;  
  }  

  if (!error) {  
    return 'Network error. Check your connection.';  
  }  

  return 'Something went wrong. Please try again.';  
};  

export const retryWithDelay = async (fn, maxRetries = 3, delay = 1000) => {  
  for (let i = 0; i < maxRetries; i++) {  
    try {  
      return await fn();  
    } catch (error) {  
      if (i === maxRetries - 1) throw error;  
      await new Promise((resolve) => setTimeout(resolve, delay));  
    }  
  }  
};
