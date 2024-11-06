"use client";

import { useQuery } from "@tanstack/react-query";
import Datetime from "./datetime";
import Item from "@/components/item";
import { getCurrentMeal } from "./functions/meal";
import { getPDTDate, getStartOfWeek, getCurrentDay } from "./functions/time";

const BASE_URL = "https://ucmmmdb.ucmmm-ucm.workers.dev/menu";
const ITEM_URL = "https://ucmmmdb.ucmmm-ucm.workers.dev/item";
interface MenuItem {
  row_id: number;
  week: string;
  location: string;
  day: string;
  meal: string;
  station: string;
  item_id: string;
}
interface ItemDetail {
  item_id: string;
  name: string;
  missing_reports: number;
}
interface MenuItemWithDetails extends MenuItem, ItemDetail {}

async function fetchItemDetails(itemId: string): Promise<ItemDetail> {
  const response = await fetch(`${ITEM_URL}/${itemId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch details for item ${itemId}`);
  }
  const data = await response.json();
  // Return the first item if it's an array, otherwise return the data itself
  return Array.isArray(data) ? data[0] : data;
}
async function fetchMenuItems(location: string) {
  const now = new Date();
  const week = getPDTDate(getStartOfWeek(new Date(now)));
  const day = getCurrentDay(new Date());
  const mealtime = getCurrentMeal(now, location);
  const params = `${BASE_URL}/${week}/${location}/${day}/${mealtime}`;
  const response = await fetch(params);
  if (!response.ok) {
    throw new Error("Failed to fetch menu items");
  }
  const items = (await response.json()) as MenuItem[];
  // Fetch details for all items in parallel
  const itemsWithDetails = await Promise.all(
    items.map(async (item) => {
      try {
        const details = await fetchItemDetails(item.item_id);
        return {
          ...item,
          ...details,
        };
      } catch (error) {
        console.error(
          `Failed to fetch details for item ${item.item_id}:`,
          error
        );
        // Return item with default values if details fetch fails
        return {
          ...item,
          name: "Unknown Item",
          missing_reports: 0,
        };
      }
    })
  );
  // group items by station
  const detailedItemsByStation = itemsWithDetails.reduce(
    (acc, item) => {
      const station = item.station.trim() || "Other";
      if (!acc[station]) {
        acc[station] = [];
      }
      acc[station].push(item);
      return acc;
    },
    {} as Record<string, MenuItemWithDetails[]>
  );

  return detailedItemsByStation;
}
export default function Cards({
  name,
  location,
}: {
  name: string;
  location: string;
}) {
  const {
    data: detailedItemsByStation,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["menu", location, getCurrentMeal(new Date(), location)],
    queryFn: () => fetchMenuItems(location),
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 3,
  });
  const now = new Date();
  const week = getPDTDate(getStartOfWeek(new Date(now)));
  const day = getCurrentDay(new Date());
  const mealtime = getCurrentMeal(now, location);
  const params = `${BASE_URL}/${week}/${location}/${day}/${mealtime}`;

  if (isLoading) {
    return (
      <div className="snap-center shrink-0 w-[300px] rounded-lg max-w-[300px] pl-5 pr-5 pt-3 pb-3 flex flex-col border-solid border-1">
        <h1 className="mb-4 text-2xl">{name}</h1>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="snap-center shrink-0 w-[300px] rounded-lg max-w-[300px] pl-5 pr-5 pt-3 pb-3 flex flex-col border-solid border-1">
        <h1 className="mb-4 text-2xl">{name}</h1>
        <div className="text-red-500">Error loading menu data</div>
        <button
          onClick={() => refetch()}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }
  return (
    <div className="snap-center shrink-0 w-[300px] rounded-lg max-w-[300px] pl-5 pr-5 pt-3 pb-3 flex flex-col bg-content1">
      <h1 className="mb-4 text-2xl text-primary/90 font-extrabold">{name}</h1>
      {Object.entries(detailedItemsByStation || {}).map(
        ([station, stationItems]) => (
          <div
            key={station}
            className="station-section flex flex-col border-1 my-2 p-2 rounded-lg border-foreground/10 bg-content3"
          >
            <h2 className="text-xl font-semibold mb-2">{station}</h2>
            <div>
              <ul className="flex flex-wrap gap-1 pt-2">
                {stationItems.map((item) => (
                  <li key={item.item_id} className="item-card flex gap-2">
                    <Item
                      key={item.item_id}
                      name={item.name}
                      reports={item.missing_reports}
                      id={item.item_id}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )
      )}
      <div className="station-section flex flex-col border-1 my-4 p-2 rounded-lg border-foreground/10 bg-foreground/5">
        <h2 className="text-xl font-semibold mb-2">Beta/Debug Information:</h2>
        <Datetime location={location} />
        <div className="text-blue-700 text-small">{params}</div>
      </div>
    </div>
  );
}
