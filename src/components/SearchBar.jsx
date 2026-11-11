export function SearchBar({ value, onChange, placeholder = 'Buscar vehículo', className = '' }) {
    return (
        <label className={className} style={{ display: 'block', marginBottom: '16px' }}>
            <input
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                aria-label={placeholder}
                style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    background: '#1e1e1e',
                    color: '#ffffff',
                    font: 'inherit'
                }}
            />
        </label>
    );
}
