"use client"
import React, { useEffect, useState } from 'react';

const getPDTDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'long',  // for the day of the week
    hour: '2-digit',  // for the hour
    minute: '2-digit', // for the minute
    month: 'long',    // for the month
    day: 'numeric',   // for the day
    year: 'numeric'   // for the year
  }).format(date);
}

const getStartOfWeek = (date: Date): Date => {
  const currentDay = date.getDay();
  const diff = date.getDate() - currentDay; // move back to Sunday
  return new Date(date.setDate(diff));
}

const Datetime: React.FC = () => {
  const [sundayOfWeek, setSundayOfWeek] = useState<string>('');
  const [currentDay, setCurrentDay] = useState<string>('');
  const [currentHour, setCurrentHour] = useState<string>('');
  const [currentMinute, setCurrentMinute] = useState<string>('');

  useEffect(() => {
    const now = new Date();

    // Get the start of the week in PDT (Sunday)
    const startOfWeek = getStartOfWeek(new Date(now));
    setSundayOfWeek(getPDTDate(startOfWeek));

    // Get the current day, hour, and minute in PDT
    setCurrentDay(getPDTDate(now));
    setCurrentHour(new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: '2-digit',
      hour12: false
    }).format(now));

    setCurrentMinute(new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      minute: '2-digit'
    }).format(now));
  }, []);

  return (
    <div>
      <h2>PDT Times</h2>
      <p>Sunday of this week: {sundayOfWeek}</p>
      <p>Current day: {currentDay}</p>
      <p>Current hour: {currentHour}</p>
      <p>Current minute: {currentMinute}</p>
    </div>
  );
};

export default Datetime;
