import Datetime from "./datetime"
import Item from "@/components/item"
import { getCurrentMeal } from "./functions/meal"
import { getPDTDate, getStartOfWeek, getCurrentDay, getCurrentHour, getCurrentMinute } from './functions/time';
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
  const response = await fetch(`${ITEM_URL}/${itemId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch details for item ${itemId}`);
  }
  const [itemDetail] = (await response.json()) as ItemDetail[];
  return itemDetail;
}

export default async function Cards(props: any){
    // get dates
    const now = new Date();
    const sunday=getStartOfWeek(now)
    const week = getPDTDate(sunday)
    const day = getCurrentDay(new Date());
    const mealtime = getCurrentMeal(now, props.location);
    const params = `${BASE_URL}/${week}/${props.location}/${day}/${mealtime}`
    const response = await fetch(params);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (!response.ok) {
    throw new Error("Failed to fetch posts");
    }

    const items = (await response.json()) as Item[];

    // Group items by station
    const itemsByStation = items.reduce((acc, item) => {
    const station = item.station.trim() || "Uncategorized";
    if (!acc[station]) {
        acc[station] = [];
    }
    acc[station].push(item);
    return acc;
    }, {} as Record<string, Item[]>);

    // Fetch details for each item
    const itemsWithDetails = await Promise.all(
    items.map(async (item) => ({
        ...item,
        ...(await fetchItemDetails(item.item_id)),
    }))
    );

    // Group items with details by station
    const detailedItemsByStation = itemsWithDetails.reduce((acc, item) => {
    const station = item.station.trim() || "Other";
    if (!acc[station]) {
        acc[station] = [];
    }
    acc[station].push(item);
    return acc;
    }, {} as Record<string, ItemDetail[]>);

    return (
        <div className="snap-center shrink-0 w-[300px] rounded-lg max-w-[300px] pl-5 pr-5 pt-3 pb-3 flex flex-col border-solid border-1 ">
            <h1 className="mb-4 text-2xl">{props.name}</h1>
            <Datetime location={props.location}></Datetime>
            <div>{params}</div>
            {Object.entries(detailedItemsByStation).map(([station, stationItems]) => (
            <div key={station} className="station-section flex flex-col border-1 my-4 p-2 rounded-lg border-foreground/10 bg-foreground/5">
                <h2 className="text-xl font-semibold mb-2">{station}</h2>
                <div>
                    <ul className="flex flex-wrap gap-1 pt-2">
                    {stationItems.map((item) => (
                        <li key={item.item_id} className="item-card flex gap-2">
                            <Item key={item.item_id} name={item.name} reports={item.missing_reports}></Item>
                        </li>
                    ))}
                    </ul>
                </div>
            </div>
            ))}
        </div>

    );
}
