import { useContext } from 'react';
import { appContext } from './contextStore';

export function useApp() {
    const context = useContext(appContext);
    if (!context) {
        throw new Error('useApp debe utilizarse dentro de un AppProvider.');
    }
    return context;
}
