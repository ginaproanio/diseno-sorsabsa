import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell, TableEmpty } from '../lib';

const DATA = [
  { id: 1, nombre: 'Juan Pérez', unidad: 'A-101', estado: 'Activo', monto: '$120.00' },
  { id: 2, nombre: 'María Gómez', unidad: 'B-204', estado: 'Pendiente', monto: '$85.50' },
  { id: 3, nombre: 'Carlos Ruiz', unidad: 'C-307', estado: 'Activo', monto: '$210.00' },
  { id: 4, nombre: 'Ana López', unidad: 'A-102', estado: 'Vencido', monto: '$45.00' },
];

export function TableDemo() {
  return (
    <div className="space-y-5">
      <p className="section-desc">
        Componente &lt;Table&gt; de @sorsabsa/ui — compound component, tokens de marca, responsive con hideOn, alineación y tamaños.
      </p>

      <div className="space-y-6">
        <div>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">Tamaño md (default)</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead align="center">Estado</TableHead>
                <TableHead align="right">Monto</TableHead>
                <TableHead hideOn="sm">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DATA.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.nombre}</TableCell>
                  <TableCell>{row.unidad}</TableCell>
                  <TableCell align="center">{row.estado}</TableCell>
                  <TableCell align="right">{row.monto}</TableCell>
                  <TableCell hideOn="sm">—</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">Tamaño sm (compacto)</div>
          <Table size="sm">
            <TableHeader>
              <TableRow>
                <TableHead size="sm">Nombre</TableHead>
                <TableHead size="sm" hideOn="md">Unidad</TableHead>
                <TableHead size="sm" align="center">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DATA.slice(0, 3).map((row) => (
                <TableRow key={row.id}>
                  <TableCell size="sm">{row.nombre}</TableCell>
                  <TableCell size="sm" hideOn="md">{row.unidad}</TableCell>
                  <TableCell size="sm" align="center">{row.estado}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">Estado vacío</div>
          <TableEmpty>No hay registros para mostrar.</TableEmpty>
        </div>
      </div>
    </div>
  );
}
