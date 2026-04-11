export const validateEmail = (email) => {  
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;  
  return re.test(email);  
};  

export const validatePassword = (password) => {  
  // Min 6 chars  
  return password && password.length >= 6;  
};  

export const validateAmount = (amount) => {  
  const num = parseFloat(amount);  
  return !isNaN(num) && num > 0;  
};  

export const validateDate = (date) => {  
  // Format: YYYY-MM-DD  
  const re = /^\d{4}-\d{2}-\d{2}$/;  
  if (!re.test(date)) return false;  
  const d = new Date(date);  
  return d instanceof Date && !isNaN(d);  
};  

export const validateRequired = (value) => {  
  return value && value.toString().trim().length > 0;  
};  

export const formatCurrency = (amount) => {  
  return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;  
};  

export const formatDate = (dateString) => {  
  const date = new Date(dateString + 'T00:00:00');  
  return date.toLocaleDateString('id-ID', {  
    year: 'numeric',  
    month: 'short',  
    day: 'numeric',  
  });  
};  

export const getErrorMessage = (error) => {  
  if (typeof error === 'string') return error;  
  if (error?.message) return error.message;  
  if (error?.response?.data?.message) return error.response.data.message;  
  return 'An error occurred. Please try again.';  
};
