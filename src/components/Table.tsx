'use client';

import { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';

export type TableSize = 'sm' | 'md' | 'lg';
export type TableAlign = 'left' | 'right' | 'center';
export type ResponsiveBreakpoint = 'sm' | 'md' | 'lg';

const ALIGN: Record<TableAlign, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

const HIDE_CLASSES: Record<ResponsiveBreakpoint, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
};

const hideClass = (hideOn?: ResponsiveBreakpoint) => (hideOn ? HIDE_CLASSES[hideOn] : '');

const SIZE_CELL_PADDING: Record<TableSize, string> = {
  sm: 'px-3 py-2',
  md: 'px-4 py-3',
  lg: 'px-5 py-4',
};

const SIZE_HEADER_TEXT: Record<TableSize, string> = {
  sm: 'text-[11px]',
  md: 'text-xs',
  lg: 'text-sm',
};

export interface TableProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  size?: TableSize;
}

export function Table({ children, size = 'md', className = '', ...rest }: TableProps) {
  return (
    <div
      className={`bg-brand-surface rounded-brand border border-brand-border shadow-sm overflow-hidden ${className}`}
      {...rest}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    </div>
  );
}

export interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export function TableHeader({ children, className = '', ...rest }: TableHeaderProps) {
  return (
    <thead className={`bg-brand-muted/30 ${className}`} {...rest}>
      {children}
    </thead>
  );
}

export interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  hideOn?: ResponsiveBreakpoint;
  align?: TableAlign;
}

export function TableHead({ children, hideOn, align = 'left', className = '', ...rest }: TableHeadProps) {
  return (
    <th
      className={`${SIZE_CELL_PADDING.md} ${ALIGN[align]} ${SIZE_HEADER_TEXT.md} font-semibold text-brand-muted uppercase tracking-wider ${hideClass(hideOn)} ${className}`}
      {...rest}
    >
      {children}
    </th>
  );
}

export interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export function TableBody({ children, className = '', ...rest }: TableBodyProps) {
  return (
    <tbody className={`divide-y divide-brand-border ${className}`} {...rest}>
      {children}
    </tbody>
  );
}

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
}

export function TableRow({ children, className = '', ...rest }: TableRowProps) {
  return (
    <tr className={`hover:bg-brand-muted/15 transition-colors ${className}`} {...rest}>
      {children}
    </tr>
  );
}

export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  hideOn?: ResponsiveBreakpoint;
  align?: TableAlign;
  size?: TableSize;
}

export function TableCell({ children, hideOn, align = 'left', size = 'md', className = '', ...rest }: TableCellProps) {
  return (
    <td
      className={`${SIZE_CELL_PADDING[size]} ${ALIGN[align]} ${hideClass(hideOn)} ${className}`}
      {...rest}
    >
      {children}
    </td>
  );
}

export interface TableEmptyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function TableEmpty({ children, className = '', ...rest }: TableEmptyProps) {
  return (
    <div
      className={`bg-brand-surface rounded-brand border border-brand-border p-12 text-center text-brand-muted font-brand ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

// Aliases en español para compatibilidad con el código existente de CondoManager
export { Table as Tabla, TableHeader as TablaEncabezado, TableHead as TablaTh, TableBody as TablaCuerpo, TableRow as TablaFila, TableCell as TablaTd, TableEmpty as TablaVacia };
