import React from 'react';

const TimeInPDT: React.FC = () => {
  const getSundayOfCurrentWeek = (date: Date) => {
    const sunday = new Date(date);
    const dayOfWeek = sunday.getUTCDay();
    const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    sunday.setUTCDate(sunday.getUTCDate() - daysToSunday);
    return sunday;
  };

  const now = new Date();
  
  // Get current day, hour, and minute in PDT
  const options = { timeZone: 'America/Los_Angeles', weekday: 'long', hour: 'numeric', hour12: false, minute: 'numeric' };
  const currentDay = now.toLocaleString('en-US', { ...options, weekday: 'long' });
  const currentHour = now.toLocaleString('en-US', { ...options, hour: 'numeric' });
  const currentMinute = now.toLocaleString('en-US', { ...options, minute: 'numeric' });
  const sundayOfWeek = getSundayOfCurrentWeek(now).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', weekday: 'long' });

  return (
    <div>
      <h1>Time in PDT</h1>
      <p><strong>Sunday of the current week:</strong> {sundayOfWeek}</p>
      <p><strong>Current Day:</strong> {currentDay}</p>
      <p><strong>Current Hour:</strong> {currentHour}</p>
      <p><strong>Current Minute:</strong> {currentMinute}</p>
    </div>
  );
};

export default TimeInPDT;
