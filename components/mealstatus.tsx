import React, { useState, useEffect } from 'react';
import { getCurrentMeal } from './functions/meal';

const MealStatus = ({ location }: { location: string }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getTimeInMinutes = (date: Date) => {
    return date.getHours() * 60 + date.getMinutes();
  }

  const formatTimeUntil = (targetTime: number) => {
    const currentMinutes = getTimeInMinutes(currentTime);
    const targetMinutes = Math.floor(targetTime / 100) * 60 + (targetTime % 100);
    const diffMinutes = targetMinutes - currentMinutes;
    
    if (diffMinutes <= 60) {
      return `in ${diffMinutes} minutes`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `in ${hours} hr${hours > 1 ? 's' : ''} ${minutes > 0 ? `and ${minutes} mins` : ''}`;
    }
  }

  const getLocationStatus = (location: string) => {
    const currentMeal = getCurrentMeal(currentTime, location);
    const hours = location === 'dc' ? {
      lunch: { start: 1030, end: 1400 },
      dinner: { start: 1500, end: 2000 },
      late_night: { start: 2100, end: 2400 }
    } : {
      breakfast: { start: currentTime.getDay() === 0 || currentTime.getDay() === 6 ? 900 : 700, end: 1030 },
      lunch: { start: 1100, end: 1500 },
      dinner: { start: 1600, end: 2100 }
    };

    const currentTimeNum = currentTime.getHours() * 100 + currentTime.getMinutes();
    
    // Find next meal time
    const meals = Object.entries(hours);
    let status = '';
    
    for (const [meal, times] of meals) {
      if (currentTimeNum < times.start) {
        status = `opens ${formatTimeUntil(times.start)}`;
        break;
      } else if (currentTimeNum >= times.start && currentTimeNum < times.end) {
        status = `open - closes ${formatTimeUntil(times.end)}`;
        break;
      } else {
        status = "closed"
      }
    }
    
    if (!status) {
      const nextDayFirstMeal = Object.values(hours)[0];
      status = formatTimeUntil(nextDayFirstMeal.start);
    }

    return {
      meal: currentMeal,
      status
    };
  };

  const locationStatus = getLocationStatus(location);

  return (
    <div className="flex flex-col border-1 mb-2 p-2 rounded-lg border-foreground/10 bg-content3">
        <div className="items-center flex flex-col">
          <p className="text-lg flex gap-2">
            <p>service:</p>
            <p className="font-bold">{locationStatus.meal}</p>
          </p>
          <p className="text-sm text-gray-500">{locationStatus.status}</p>
        </div>
    </div>
  );
};

export default MealStatus;
