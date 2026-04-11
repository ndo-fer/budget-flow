// src/components/ExpenseCalendar.js  
import React from 'react';  
import {  
  View,  
  Text,  
  StyleSheet,  
  TouchableOpacity,  
  Dimensions,  
} from 'react-native';  

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];  
const MONTHS = [  
  'January', 'February', 'March', 'April', 'May', 'June',  
  'July', 'August', 'September', 'October', 'November', 'December',  
];  

export default function ExpenseCalendar({  
  selectedDate,  
  onDateSelect,  
  expenseDates = [],  
}) {  
  const [currentDate, setCurrentDate] = React.useState(new Date(selectedDate));  

  const year = currentDate.getFullYear();  
  const month = currentDate.getMonth();  

  // Get first day of month and number of days  
  const firstDay = new Date(year, month, 1).getDay();  
  const daysInMonth = new Date(year, month + 1, 0).getDate();  

  // Create calendar grid  
  const calendarDays = [];  
  for (let i = 0; i < firstDay; i++) {  
    calendarDays.push(null);  
  }  
  for (let i = 1; i <= daysInMonth; i++) {  
    calendarDays.push(i);  
  }  

  const handlePrevMonth = () => {  
    setCurrentDate(new Date(year, month - 1, 1));  
  };  

  const handleNextMonth = () => {  
    setCurrentDate(new Date(year, month + 1, 1));  
  };  

  const handleSelectDay = (day) => {  
    if (!day) return;  
    const selected = new Date(year, month, day);  
    // Fix timezone issue when selecting date locally
    // Adjust to local date string instead of strict ISO
    const dateStr = [
      selected.getFullYear(),
      String(selected.getMonth() + 1).padStart(2, '0'),
      String(selected.getDate()).padStart(2, '0')
    ].join('-');
    onDateSelect(dateStr);  
  };  

  const getDateString = (day) => {  
    const d = new Date(year, month, day);
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0')
    ].join('-');
  };  

  const isSelected = (day) => {  
    if (!day) return false;  
    return getDateString(day) === selectedDate;  
  };  

  const hasExpenses = (day) => {  
    if (!day) return false;  
    return expenseDates.includes(getDateString(day));  
  };  

  return (  
    <View style={styles.container}>  
      {/* Month/Year Header */}  
      <View style={styles.header}>  
        <TouchableOpacity onPress={handlePrevMonth}>  
          <Text style={styles.navBtn}>←</Text>  
        </TouchableOpacity>  

        <Text style={styles.monthYear}>  
          {MONTHS[month]} {year}  
        </Text>  

        <TouchableOpacity onPress={handleNextMonth}>  
          <Text style={styles.navBtn}>→</Text>  
        </TouchableOpacity>  
      </View>  

      {/* Day of Week Labels */}  
      <View style={styles.daysOfWeek}>  
        {DAYS_OF_WEEK.map((day) => (  
          <Text key={day} style={styles.dayLabel}>  
            {day}  
          </Text>  
        ))}  
      </View>  

      {/* Calendar Grid */}  
      <View style={styles.calendar}>  
        {calendarDays.map((day, index) => (  
          <TouchableOpacity  
            key={index}  
            style={[  
              styles.dayCell,  
              isSelected(day) && styles.selectedDay,  
              hasExpenses(day) && styles.hasExpensesDay,  
            ]}  
            onPress={() => handleSelectDay(day)}  
            disabled={!day}  
          >  
            {day && <Text style={[styles.dayText, isSelected(day) && styles.selectedDayText]}>{day}</Text>}  
            {hasExpenses(day) && <View style={[styles.expenseDot, isSelected(day) && { backgroundColor: 'white' }]} />}  
          </TouchableOpacity>  
        ))}  
      </View>  
    </View>  
  );  
}  

const styles = StyleSheet.create({  
  container: {  
    backgroundColor: 'white',  
    borderRadius: 12,  
    padding: 12,  
    marginBottom: 16,  
  },  
  header: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    alignItems: 'center',  
    marginBottom: 16,  
    paddingBottom: 12,  
    borderBottomWidth: 1,  
    borderBottomColor: '#eee',  
  },  
  monthYear: {  
    fontSize: 16,  
    fontWeight: '600',  
    color: '#333',  
  },  
  navBtn: {  
    fontSize: 18,  
    color: '#1976d2',  
    fontWeight: 'bold',  
    paddingHorizontal: 10,
  },  
  daysOfWeek: {  
    flexDirection: 'row',  
    marginBottom: 8,  
  },  
  dayLabel: {  
    flex: 1,  
    textAlign: 'center',  
    fontSize: 12,  
    fontWeight: '600',  
    color: '#999',  
    paddingVertical: 8,  
  },  
  calendar: {  
    flexDirection: 'row',  
    flexWrap: 'wrap',  
  },  
  dayCell: {  
    width: '14.28%', // 100 / 7 days  
    aspectRatio: 1,  
    justifyContent: 'center',  
    alignItems: 'center',  
    borderRadius: 8,  
    position: 'relative',  
  },  
  selectedDay: {  
    backgroundColor: '#1976d2',  
  },  
  hasExpensesDay: {  
    backgroundColor: '#fff3cd',  
  },  
  dayText: {  
    fontSize: 13,  
    fontWeight: '600',  
    color: '#333',  
  },  
  selectedDayText: {
    color: 'white',
  },
  expenseDot: {  
    width: 4,  
    height: 4,  
    borderRadius: 2,  
    backgroundColor: '#f44336',  
    position: 'absolute',  
    bottom: 6,  
  },  
});
