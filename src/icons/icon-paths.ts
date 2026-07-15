/**
 * icon-paths.ts — catálogo de trazos SVG del ecosistema SORSABSA.
 * Un solo <path> por icono (subpaths múltiples vía comandos "M" encadenados),
 * pensado para pintarse con stroke="currentColor" a 20/24px y 1.75px de grosor.
 * Sustituye a lucide-react y a emoji usados como icono en los productos.
 */
export const ICON_PATHS = {
  home: 'M3 11l9-7 9 7M6 9.5V20a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1V9.5',
  users: 'M6.5 8a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0 -5 0M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M14.5 5.5a2.2 2.2 0 1 1 0 4.4M20 20c0-2.4-1.4-4.5-3.4-5.4',
  gift: 'M4 9h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 13h16M12 9v11M12 9c-1.2-3-3.5-5-5.2-3.6C5 6.6 6 9 8 9M12 9c1.2-3 3.5-5 5.2-3.6C19 6.6 18 9 16 9',
  settings: 'M9 12a3 3 0 1 0 6 0 3 3 0 1 0 -6 0M12 3v2.5M12 16.5V19M4.2 4.2l1.8 1.8M18 18l1.8 1.8M3 12h2.5M18.5 12H21M4.2 19.8L6 18M18 6l1.8-1.8',
  handshake: 'M2 13l5-4 3.5 2.5M14.5 11.5L18 9l4 3.5M9.5 11.5l2.5 2-2 2M14.5 11.5l-2.5 2.5',
  plus: 'M12 5v14M5 12h14',
  userRound: 'M12 12a4 4 0 1 0 0-8 4 4 0 1 0 0 8zM4 20c0-4.4 3.6-8 8-8s8 3.6 8 8',
  mapPin: 'M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 1 0 0 5',
  bold: 'M6 4h6a4 4 0 0 1 0 8H6zM6 12h7a4 4 0 0 1 0 8H6z',
  italic: 'M11 4h6M7 20h6M14 4l-4 16',
  underline: 'M6 4v7a6 6 0 0 0 12 0V4M5 20h14',
  link: 'M9 15l6-6M13 5l1.5-1.5a4 4 0 1 1 5.7 5.7L18.5 11M11 19l-1.5 1.5a4 4 0 1 1-5.7-5.7L5.5 13',
  notebookPen: 'M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5M9 13h6M9 17h4',
  phone: 'M5 4h3.5l1.5 4-2 1.8c1 2.2 2.5 3.7 4.7 4.7l1.8-2 4 1.5V18a2 2 0 0 1-2 2C9.6 20 4 14.4 4 7a2 2 0 0 1 1-3z',
  mail: 'M3 5h18v14H3zM3 7l9 6 9-6',
  calendar: 'M3 5h18v16H3zM8 3v4M16 3v4M3 10h18',
  messageCircle: 'M4 12a8 8 0 1 1 3.5 6.6L4 20l1.2-3.6A8 8 0 0 1 4 12z',
  send: 'M4 11l16-7-6 16-3-6-7-3z',
  clock: 'M12 4a8 8 0 1 0 0 16 8 8 0 1 0 0-16zM12 8v4l3 2',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6L6 18',
  bed: 'M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 18v2M21 18v2M3 12V7a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3M13 10h6',
  bath: 'M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM7 12V5a2 2 0 0 1 3.5-1.3M6 19v2M18 19v2',
  ruler: 'M4 15l5-10 11 5.5-5 10zM8.5 6.7l1 2M7 9.6l1 2M5.4 12.5l1 2M11 4.9l1 2',
} as const;

export type IconName = keyof typeof ICON_PATHS;
