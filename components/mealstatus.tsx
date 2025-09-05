import React, { useState, useEffect } from 'react';
import { getCurrentMeal } from './functions/meal';
import { estimateLineSize } from './functions/line';

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
    if (location === 'dc' && (currentTime.getDay() === 0 || currentTime.getDay() === 6)) {
        return {
        meal: "closed",
        status: "closed on weekends"
      };
    }
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

  const line = locationStatus.meal !== 'closed' ? estimateLineSize(currentTime, locationStatus.meal, location) : null;

  const levelColor: Record<string,string> = {
    low: 'bg-green-500/20 text-green-600 dark:text-green-400',
    moderate: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
    high: 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
    peak: 'bg-red-500/20 text-red-600 dark:text-red-400'
  };

  return (
    <div className="flex flex-col border-1 mb-2 p-2 rounded-lg border-foreground/10 bg-content3">
      <div className="items-center flex flex-col gap-1">
        <div className="text-lg flex gap-2">
          <span>service:</span>
          <span className="font-bold">{locationStatus.meal}</span>
        </div>
        <p className="text-sm text-gray-500">{locationStatus.status}</p>
        {line && (
          <div className="flex flex-col items-center text-xs mt-1 w-full group relative">
            <div className="flex gap-2 items-center">
              <span className="uppercase tracking-wide">line:</span>
              <span className={`px-2 py-0.5 rounded-full font-semibold ${levelColor[line.level]}`}>{line.level}</span>
              <span className="text-foreground/50">{Math.round(line.score)}</span>
              <span className="cursor-help text-foreground/40 hover:text-foreground/70 transition-colors" aria-label="How is line calculated?">ⓘ</span>
            </div>
            <p className="text-[10px] leading-snug text-foreground/50 text-center">{line.reason}</p>
            {/* Tooltip */}
            <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity absolute top-full mt-1 z-50 w-56 text-[10px] leading-snug bg-content2/90 backdrop-blur border border-foreground/10 rounded p-2 shadow">
              <p className="font-semibold mb-1">Line estimate (beta)</p>
              <p>Score = meal baseline + recent class release surge - lull adjustment.</p>
              <ul className="list-disc ml-4 mt-1 space-y-0.5">
                <li>Higher after class end times (:20, :15, :45).</li>
                <li>Peaks ~2 min after release.</li>
                <li>Lowers during mid-block lulls.</li>
              </ul>
              <p className="mt-1 italic">Heuristic; not real-time sensor data.</p>
            </div>
          </div>
        )}
      </div>
      {(!line && locationStatus.meal === 'closed') && (
        <p className="text-xs text-center text-foreground/50 mt-2">line estimation unavailable while closed</p>
      )}
    </div>
  );
};


export function isOpen(location: string): boolean {
  const currentTime=new Date();
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
  
  const meals = Object.entries(hours);
  let status = false;
  for (const [meal, times] of meals) {
    if (currentTimeNum < times.start) {
      status = false;
      break;
    } else if (currentTimeNum >= times.start && currentTimeNum < times.end) {
      status = true;
      break;
    } else {
      status = false;
    }
  }
  if (location === 'dc' && (currentTime.getDay() === 0 || currentTime.getDay() === 6)) {
    return false;
}
  return status;
};

export default MealStatus;