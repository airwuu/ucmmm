import TimeInPDT from "./datetime"
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

export default async function Cards() {
  const response = await fetch(`${BASE_URL}/2024-11-03/pav/sunday/breakfast`);
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
    const station = item.station.trim() || "Uncategorized";
    if (!acc[station]) {
      acc[station] = [];
    }
    acc[station].push(item);
    return acc;
  }, {} as Record<string, ItemDetail[]>);

  return (
    <div className="yay">
      <TimeInPDT></TimeInPDT>
      <h1 className="mb-4 text-2xl">Menu Items by Station</h1>
      {Object.entries(detailedItemsByStation).map(([station, stationItems]) => (
        <div key={station} className="station-section">
          <h2 className="text-xl font-semibold mb-2">{station}</h2>
          <ul>
            {stationItems.map((item) => (
              <li key={item.item_id} className="item-card flex gap-2">
                <p>{item.name}</p>
                <p>Reports: {item.missing_reports}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
