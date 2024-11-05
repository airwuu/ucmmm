'use client';

import { useQuery } from '@tanstack/react-query';
import Datetime from "./datetime";
import Item from "@/components/item";
import { getCurrentMeal } from "./functions/meal";
import { getPDTDate, getStartOfWeek, getCurrentDay } from './functions/time';

const BASE_URL = "https://ucmmmdb.ucmmm-ucm.workers.dev/menu";
const ITEM_URL = "https://ucmmmdb.ucmmm-ucm.workers.dev/item";

interface Item {
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

async function fetchItemDetails(itemId: string): Promise<ItemDetail> {
    const response = await fetch(`${ITEM_URL}/${itemId}` + new URLSearchParams({mode:"no-cors"}));
    if (!response.ok) {
        throw new Error(`Failed to fetch details for item ${itemId}`);
    }
    const [itemDetail] = (await response.json()) as ItemDetail[];
    return itemDetail;
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
    
    const items = await response.json() as Item[];
    
    // Fetch details for all items in parallel
    const itemsWithDetails = await Promise.all(
        items.map(async (item) => ({
            ...item,
            ...(await fetchItemDetails(item.item_id)),
        }))
    );

    // Group items by station
    const detailedItemsByStation = itemsWithDetails.reduce((acc, item) => {
        const station = item.station.trim() || "Other";
        if (!acc[station]) {
            acc[station] = [];
        }
        acc[station].push(item);
        return acc;
    }, {} as Record<string, (Item & ItemDetail)[]>);

    return detailedItemsByStation;
}

export default function Cards({ name, location }: { name: string; location: string }) {
    const { data: detailedItemsByStation, isLoading, error } = useQuery({
        queryKey: ['menu', location],
        queryFn: () => fetchMenuItems(location),
        // Refresh data every 5 minutes
        refetchInterval: 5 * 60 * 1000,
        // Refresh data when window regains focus
        refetchOnWindowFocus: true,
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
            </div>
        );
    }

    return (
        <div className="snap-center shrink-0 w-[300px] rounded-lg max-w-[300px] pl-5 pr-5 pt-3 pb-3 flex flex-col border-solid border-1">
            <h1 className="mb-4 text-2xl">{name}</h1>
            <Datetime location={location}></Datetime>
            <div>{params}</div>
            {Object.entries(detailedItemsByStation || {}).map(([station, stationItems]) => (
                <div key={station} className="station-section flex flex-col border-1 my-4 p-2 rounded-lg border-foreground/10 bg-foreground/5">
                    <h2 className="text-xl font-semibold mb-2">{station}</h2>
                    <div>
                        <ul className="flex flex-wrap gap-1 pt-2">
                            {stationItems.map((item) => (
                                <li key={item.item_id} className="item-card flex gap-2">
                                    <Item 
                                        key={item.item_id} 
                                        name={item.name} 
                                        reports={item.missing_reports}
                                    />
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ))}
        </div>
    );
}