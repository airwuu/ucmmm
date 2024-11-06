export const getCurrentMeal = (date: Date, location: string): string => {
  const options = { timeZone: "America/Los_Angeles", hour12: false };
  const dayOfWeek = new Intl.DateTimeFormat("en-US", {
    ...options,
    weekday: "long",
  })
    .format(date)
    .toLowerCase();
  const hour = parseInt(
    new Intl.DateTimeFormat("en-US", { ...options, hour: "2-digit" }).format(
      date
    ),
    10
  );
  const minute = parseInt(
    new Intl.DateTimeFormat("en-US", { ...options, minute: "2-digit" }).format(
      date
    ),
    10
  );

  // convert hour and minute into a single number (e.g., 7:30 -> 730, 15:00 -> 1500)
  const currentTime = hour * 100 + minute;

  if (location && location == "dc") {
    const weekdayHours = {
      lunchStart: 1030, // 10:30 AM
      lunchEnd: 1400, // 2:00 PM
      dinnerStart: 1500, // 3:00 PM
      dinnerEnd: 2000, // 8:00 PM
      lateNightStart: 2100, // 9:00 PM
      lateNightEnd: 2400, // Midnight (12:00 AM)
    };

    if (
      currentTime >= weekdayHours.lunchStart &&
      currentTime < weekdayHours.lunchEnd
    ) {
      return "lunch";
    } else if (
      currentTime >= weekdayHours.dinnerStart &&
      currentTime < weekdayHours.dinnerEnd
    ) {
      return "dinner";
    } else if (
      currentTime >= weekdayHours.lateNightStart &&
      currentTime < weekdayHours.lateNightEnd
    ) {
      return "late_night";
    } else if (currentTime < weekdayHours.lunchStart) {
      return "lunch";
    } else if (currentTime < weekdayHours.dinnerStart) {
      return "dinner";
    } else {
      return "late_night";
    }
  } else {
    // define meal times for weekdays
    const weekdayHours = {
      breakfastStart: 700,
      breakfastEnd: 1030,
      lunchStart: 1100,
      lunchEnd: 1500,
      dinnerStart: 1600,
      dinnerEnd: 2100,
    };
    // define meal times for weekends
    const weekendHours = {
      breakfastStart: 900,
      breakfastEnd: 1030,
      lunchStart: 1100,
      lunchEnd: 1500,
      dinnerStart: 1600,
      dinnerEnd: 2100,
    };

    // choose which hours
    const hours = ["saturday", "sunday"].includes(dayOfWeek)
      ? weekendHours
      : weekdayHours;

    if (
      currentTime >= hours.breakfastStart &&
      currentTime < hours.breakfastEnd
    ) {
      return "breakfast";
    } else if (
      currentTime >= hours.lunchStart &&
      currentTime < hours.lunchEnd
    ) {
      return "lunch";
    } else if (
      currentTime >= hours.dinnerStart &&
      currentTime < hours.dinnerEnd
    ) {
      return "dinner";
    } else if (currentTime < hours.breakfastStart) {
      return "breakfast";
    } else if (currentTime < hours.lunchStart) {
      return "lunch";
    } else {
      return "dinner";
    }
  }
};
