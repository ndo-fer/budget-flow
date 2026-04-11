export const getMonthDateRange = (monthStr) => {  
  // Input: "2026-04" or similar  
  if (!monthStr || !monthStr.includes('-')) {
    return { startDate: null, endDate: null, lastDay: null };
  }
  const [year, month] = monthStr.split('-');  
  const yearNum = parseInt(year);  
  const monthNum = parseInt(month);  
  
  // First day of month  
  const startDate = new Date(yearNum, monthNum - 1, 1);  
  
  // Last day of month (correct day number)  
  const endDate = new Date(yearNum, monthNum, 0);  
  
  // To avoid timezone shift issues with ISO string, format manually:
  const startStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
  const endStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

  return {  
    startDate: startStr,  
    endDate: endStr,     
    lastDay: endDate.getDate(),  
  };  
};
