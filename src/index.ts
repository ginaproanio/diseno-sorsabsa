export {
  BrandProvider,
  useBrand,
  brandToCssVars,
  hexToRgbTriplet,
  type BrandConfig,
  type BrandColors,
  type WordmarkTone,
  type WordmarkAnimation,
} from './brand/BrandProvider';
export { BRANDS, getBrand, ESTADOS_FORENSIC } from './brand/brands';
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './components/Button';
export { Input, type InputProps } from './components/Input';
export { Card, CardHeader, CardTitle, CardContent, type CardProps, type CardHeaderProps } from './components/Card';
export { Wordmark } from './components/Wordmark';
export { TypingDots } from './components/TypingDots';
export { StatusBadge, type StatusBadgeProps, type StatusTone } from './components/StatusBadge';
export { MobileNav, type MobileNavItem, type MobileNavProps } from './components/MobileNav';
export { PropertyListingCard, type PropertyListingCardProps } from './components/PropertyListingCard';
export { PropertyCarousel, type PropertyCarouselProps } from './components/PropertyCarousel';
export { Icon, ICON_PATHS, type IconName, type IconProps } from './icons/Icon';
export {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableEmpty,
  type TableSize,
  type TableAlign,
  type ResponsiveBreakpoint,
  type TableProps,
  type TableHeaderProps,
  type TableHeadProps,
  type TableBodyProps,
  type TableRowProps,
  type TableCellProps,
  type TableEmptyProps,
  Tabla,
  TablaEncabezado,
  TablaTh,
  TablaCuerpo,
  TablaFila,
  TablaTd,
  TablaVacia,
} from './components/Table';
export { NotificationBell, type Notificacion, type NotificationBellProps } from './components/NotificationBell';
export { Tag, type TagProps } from './components/Tag';
// 23-ago-2026 — las piezas que FALTABAN, y cuya ausencia empujó a JustiRed y a
// CondoManager a resolverlo por su cuenta. Ver el docblock de Select.tsx: no
// eligieron duplicar, trajeron una librería entera para conseguir un
// desplegable y el resto vino de arriba. El check de conformidad informaba eso
// como indisciplina del producto porque mide en una sola dirección.
export { Select, type SelectProps } from './components/Select';
export { Checkbox, type CheckboxProps } from './components/Checkbox';
export { Tabs, type TabsProps, type Pestana } from './components/Tabs';
export { ConfirmarAccion, type ConfirmarAccionProps } from './components/ConfirmarAccion';
export { Avatar, type AvatarProps } from './components/Avatar';
export { SectionHeader, type SectionHeaderProps } from './components/SectionHeader';
export { FormSection, type FormSectionProps } from './components/FormSection';
export { Toast, type ToastProps } from './components/Toast';
export { SegmentedControl, type SegmentedControlProps, type SegmentedOption } from './components/SegmentedControl';
export { AppShell, type AppShellProps } from './components/AppShell';
export { SinAcceso, type SinAccesoProps } from './components/SinAcceso';
export { FooterEcosistema, type FooterEcosistemaProps } from './components/FooterEcosistema';
export { useOnClickOutside } from './hooks/useOnClickOutside';
export { mensajeDeError, mensajeDeErrorData } from './lib/apiError';
export { urlDeSalida, salirDelEcosistema } from './lib/portero';
