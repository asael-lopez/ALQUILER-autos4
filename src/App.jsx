import { useState, useEffect, useRef } from 'react';
import './App.css';
import { AppProvider } from './context/AppContext.jsx';
import { useApp } from './context/useApp.js';
import { translateAttribute, translateText } from './i18n.js';
import { Fleet } from './pages/Fleet';
import { Dashboard } from './pages/Dashboard';
import { Reports } from './pages/Reports';
import { Home } from './pages/Home';
import { MapaSucursales } from './components/MapaSucursales';
import { SiteHeader } from './components/SiteHeader';
import { SiteFooter } from './components/SiteFooter';

function AppContent() {
    const { language } = useApp();
    const textRecords = useRef(new WeakMap());
    const attributeRecords = useRef(new WeakMap());
    // Función para obtener la pestaña desde el parámetro ?tab= de la URL
    const getTabFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('tab') || 'home';
    };

    const [activeTab, setActiveTab] = useState(getTabFromUrl);

    // Escuchar constantemente los cambios en la URL (por si vienen de index.html o usan los botones del navegador)
    useEffect(() => {
        const handleLocationChange = () => {
            setActiveTab(getTabFromUrl());
        };

        // Actualiza al cargar o navegar
        handleLocationChange();

        window.addEventListener('popstate', handleLocationChange);
        return () => window.removeEventListener('popstate', handleLocationChange);
    }, []);

    useEffect(() => {
        document.documentElement.lang = language;
        document.title = language === 'en' ? 'Santa Lucía Rental' : 'Santa Lucía Alquiler';

        const localizeTextNode = (node) => {
            const currentValue = node.nodeValue;
            let record = textRecords.current.get(node);
            if (!record) {
                record = { original: currentValue, rendered: currentValue };
                textRecords.current.set(node, record);
            } else if (currentValue !== record.rendered) {
                record.original = currentValue;
            }

            const nextValue = translateText(record.original, language);
            if (currentValue !== nextValue) node.nodeValue = nextValue;
            record.rendered = nextValue;
        };

        const localizeElement = (element) => {
            const records = attributeRecords.current.get(element) || new Map();
            for (const attribute of Array.from(element.attributes)) {
                const name = attribute.name.toLowerCase();
                if (!['title', 'placeholder', 'aria-label', 'alt'].includes(name)) continue;

                let record = records.get(name);
                if (!record) {
                    record = { original: attribute.value, rendered: attribute.value };
                    records.set(name, record);
                } else if (attribute.value !== record.rendered) {
                    record.original = attribute.value;
                }

                const nextValue = translateAttribute(name, record.original, language);
                if (attribute.value !== nextValue) element.setAttribute(name, nextValue);
                record.rendered = nextValue;
            }
            attributeRecords.current.set(element, records);
        };

        const localizeNode = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                localizeTextNode(node);
                return;
            }
            if (node.nodeType !== Node.ELEMENT_NODE) return;

            localizeElement(node);
            const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
            let textNode;
            while ((textNode = walker.nextNode())) localizeTextNode(textNode);
            node.querySelectorAll('*').forEach(localizeElement);
        };

        localizeNode(document.body);
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'characterData') {
                    localizeTextNode(mutation.target);
                } else if (mutation.type === 'attributes') {
                    localizeElement(mutation.target);
                } else {
                    mutation.addedNodes.forEach(localizeNode);
                }
            });
        });
        observer.observe(document.body, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['title', 'placeholder', 'aria-label', 'alt']
        });

        return () => observer.disconnect();
    }, [language]);

    const handleTabChange = (tabName) => {
        setActiveTab(tabName);
        // Actualizar la URL sin recargar la página completa
        window.history.pushState({}, '', `/?tab=${tabName}`);
        window.scrollTo(0, 0);
    };

    if (new URLSearchParams(window.location.search).get('embed') === 'map') {
        return <MapaSucursales />;
    }

    return (
        <div className="app-shell">
            <SiteHeader activeTab={activeTab} onTabChange={handleTabChange} />

            {/* Renderizado de los Módulos Reactivos */}
            <main>
                {activeTab === 'home' && <Home onTabChange={handleTabChange} />}
                {activeTab === 'fleet' && <Fleet />}
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'reports' && <Reports />}
                {activeTab === 'location' && <MapaSucursales />}
            </main>
            <SiteFooter onTabChange={handleTabChange} />
        </div>
    );
}

export default function App() {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
}
