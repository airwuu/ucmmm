export const getPDTDate = (date: Date): string => {
    // Format the Sunday of this week as "YYYY-MM-DD" in PDT
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  };
  
export const getStartOfWeek = (date: Date): Date => {
    const currentDay = date.getDay();
    const diff = date.getDate() - currentDay; // Move back to Sunday
    return new Date(date.setDate(diff));
};

export const getCurrentDay = (date: Date): string => {
    // Get the current day as the weekday name in lowercase in PDT
    const dayFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        weekday: 'long',
    });
    return dayFormatter.format(date).toLowerCase();
};

export const getCurrentHour = (date: Date): string => {
    // Get the current hour in PDT
    return new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        hour: '2-digit',
        hour12: false,
    }).format(date);
};

export const getCurrentMinute = (date: Date): string => {
    // Get the current minute in PDT
    return new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        minute: '2-digit',
    }).format(date);
};
  