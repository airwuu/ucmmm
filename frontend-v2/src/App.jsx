import { useState } from 'react';
import { useTheme } from './hooks/useTheme';
import { useToast } from './hooks/useToast';
import Header from './components/Header';
import ThemeSelector from './components/ThemeSelector';
import InfoModal from './components/InfoModal';
import SwipeablePanel, { Panel } from './components/SwipeablePanel';
import MenuCard from './components/MenuCard';
import FoodTrucks from './components/FoodTrucks';
import { ToastContainer } from './components/Toast';
import './App.css';

export default function App() {
    const { theme } = useTheme();
    const [themeOpen, setThemeOpen] = useState(false);
    const [infoOpen, setInfoOpen] = useState(false);
    const { toasts, removeToast, showSuccess, showUndo } = useToast();

    // Pass toast handlers to MenuCard components
    const toastHandlers = { showSuccess, showUndo };

    return (
        <div className="app" data-theme={theme}>
            <Header
                onThemeClick={() => setThemeOpen(true)}
                onInfoClick={() => setInfoOpen(true)}
            />

            <SwipeablePanel>
                <Panel>
                    <MenuCard location="pav" name="Pavilion" toastHandlers={toastHandlers} />
                </Panel>
                <Panel>
                    <MenuCard location="dc" name="Dining Center" toastHandlers={toastHandlers} />
                </Panel>
                <Panel>
                    <FoodTrucks />
                </Panel>
            </SwipeablePanel>

            <ThemeSelector
                isOpen={themeOpen}
                onClose={() => setThemeOpen(false)}
            />

            <InfoModal
                isOpen={infoOpen}
                onClose={() => setInfoOpen(false)}
            />

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
}
