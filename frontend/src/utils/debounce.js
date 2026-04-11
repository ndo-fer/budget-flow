export const debounce = (fn, delay = 300) => {  
  let timeoutId;  

  return (...args) => {  
    clearTimeout(timeoutId);  
    timeoutId = setTimeout(() => {  
      fn(...args);  
    }, delay);  
  };  
};  

export const throttle = (fn, delay = 300) => {  
  let lastCall = 0;  

  return (...args) => {  
    const now = Date.now();  
    if (now - lastCall >= delay) {  
      lastCall = now;  
      fn(...args);  
    }  
  };  
};
