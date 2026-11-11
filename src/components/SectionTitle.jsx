export function SectionTitle({ children, as: Heading = 'h2', className = '', style }) {
    return (
        <Heading className={className} style={style}>
            {children}
        </Heading>
    );
}
