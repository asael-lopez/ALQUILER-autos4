import { jsPDF } from 'jspdf';

export function createReservationPdf(reservation) {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const left = 20;
    let y = 22;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text('Santa Lucia Alquiler', left, y);
    y += 12;

    pdf.setFontSize(14);
    pdf.text('Solicitud de reserva', left, y);
    y += 10;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Referencia: ${reservation.id}`, left, y);
    y += 10;

    const addSection = (title, rows) => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text(title, left, y);
        y += 7;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);

        rows.forEach(([label, value]) => {
            const lines = pdf.splitTextToSize(`${label}: ${value || 'No proporcionado'}`, pageWidth - left * 2);
            pdf.text(lines, left, y);
            y += lines.length * 5 + 2;
        });
        y += 4;
    };

    addSection('Vehiculo', [
        ['Modelo', reservation.autoNombre],
        ['Ano', reservation.anio || 'Por confirmar'],
        ['Categoria', reservation.categoria],
        ['Transmision', reservation.transmision || 'Por confirmar'],
        ['Combustible', reservation.combustible || 'Por confirmar'],
        ['Aire acondicionado', reservation.aireAcondicionado == null
            ? 'Por confirmar'
            : reservation.aireAcondicionado ? 'Si' : 'No'],
        ['Pasajeros', reservation.pasajeros ?? 'Por confirmar'],
        ['Equipaje estimado', reservation.maletas == null
            ? 'Por confirmar'
            : `Aprox. ${reservation.maletas} maletas`],
        ['Precio diario real', `$${Number(reservation.precioDia || 0).toFixed(2)} USD`],
        ['Tarifa diaria aplicada', `$${Number(reservation.precioDiaAplicado ?? reservation.precioDia ?? 0).toFixed(2)} USD`],
        ['Descuento por duracion', `${Math.round(Number(reservation.descuentoDuracion || 0) * 100)}%`],
        ['Fechas', `${reservation.fechaInicio} al ${reservation.fechaFin}`],
        ['Duracion', `${reservation.dias} dias`],
        ['Lugar de entrega', reservation.lugar],
        ['Servicios adicionales', reservation.extras?.join(', ') || 'Ninguno'],
        ['Total estimado', `$${Number(reservation.monto || 0).toFixed(2)} USD`],
        ...(reservation.totalReferencia != null ? [[
            'Equivalente referencial',
            `${Number(reservation.totalReferencia).toFixed(2)} ${reservation.monedaReferencia}` +
            ` (tasa del ${reservation.fechaTasaCambio || 'dia de la solicitud'}, se cobra en USD)`
        ]] : []),
        ...(reservation.distanciaSucursalKm != null
            ? [['Distancia a la sucursal', `${reservation.distanciaSucursalKm} km`]] : []),
        ...(reservation.climaEstimado
            ? [['Clima estimado en sucursal', reservation.climaEstimado.replace(/°/g, '')]] : [])
    ]);

    addSection('Cliente', [
        ['Nombre', reservation.clienteNombre],
        ['Correo', reservation.usuario],
        ['Telefono', reservation.telefono]
    ]);

    pdf.setFontSize(9);
    pdf.setTextColor(100);
    pdf.text('Solicitud pendiente de aprobacion. El alquiler se confirma al ser aprobado.', left, y);
    return pdf.output('blob');
}
