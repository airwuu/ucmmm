import MenuCard from './MenuCard';
import FoodTrucks from './FoodTrucks';
import './DesktopLayout.css';

/**
 * Desktop layout that shows all panels side-by-side
 */
export default function DesktopLayout({ toastHandlers }) {
    return (
        <div className="desktop-layout">
            <div className="desktop-panel">
                <MenuCard location="pav" name="Pavilion" toastHandlers={toastHandlers} />
            </div>
            <div className="desktop-panel">
                <MenuCard location="dc" name="Dining Center" toastHandlers={toastHandlers} />
            </div>
            <div className="desktop-panel">
                <FoodTrucks />
            </div>
        </div>
    );
}
