"use client";
import React, { useEffect, useState } from "react";
import { getCurrentMeal } from "./functions/meal";

const getPDTDate = (date: Date): string => {
  // Format the Sunday of this week as "YYYY-MM-DD" in PDT
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const getStartOfWeek = (date: Date): Date => {
  const currentDay = date.getDay();
  const diff = date.getDate() - currentDay; // Move back to Sunday
  return new Date(date.setDate(diff));
};

interface datetimeProps {
  location: string;
}
const PDTTimeComponent: React.FC<datetimeProps> = ({ location }) => {
  const [sundayOfWeek, setSundayOfWeek] = useState<string>("");
  const [currentDay, setCurrentDay] = useState<string>("");
  const [currentHour, setCurrentHour] = useState<string>("");
  const [currentMinute, setCurrentMinute] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    // Get the start of the week in PDT (Sunday)
    const startOfWeek = getStartOfWeek(new Date(now));
    setSundayOfWeek(getPDTDate(startOfWeek));

    // Get the current day as the weekday name in lowercase in PDT
    const dayFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      weekday: "long",
    });
    setCurrentDay(dayFormatter.format(now).toLowerCase());

    // Get the current hour in PDT
    setCurrentHour(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles",
        hour: "2-digit",
        hour12: false,
      }).format(now)
    );

    // Get the current minute in PDT
    setCurrentMinute(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles",
        minute: "2-digit",
      }).format(now)
    );
  }, []);

  return (
    <div>
      {/* <h2></h2> */}
      <p>Week of {sundayOfWeek}</p>
      <p>
        Updated: {currentDay}, {currentHour}:{currentMinute}
      </p>
      <p>Meal: {getCurrentMeal(new Date(), location)}</p>
      {/* <p>Current day: {currentDay}</p>
      <p>Current hour: {currentHour}</p>
      <p>Current minute: {currentMinute}</p> */}
    </div>
  );
};

export default PDTTimeComponent;
