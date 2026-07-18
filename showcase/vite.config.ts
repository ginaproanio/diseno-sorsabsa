import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Este showcase importa @sorsabsa/ui directamente desde el código FUENTE
 * (../src), no desde npm — así refleja siempre el estado real del repo sin
 * publicar ni bumpear versión. Como ../src es físicamente externo a este
 * proyecto, dos cosas necesitan ajuste respecto de un Vite normal:
 *
 * 1. server.fs.allow — el servidor de dev de Vite por defecto solo sirve
 *    archivos dentro de la raíz del proyecto; hay que abrir el directorio
 *    padre (raíz del repo) para poder servir ../src/**\/*.tsx y
 *    ../src/tokens.css.
 *
 * 2. resolve.alias de react/react-dom — sin esto, los archivos de ESTE
 *    proyecto (showcase/src) resuelven React desde showcase/node_modules,
 *    mientras que los de ../src (físicamente fuera de este proyecto)
 *    resuelven React trepando directorios hasta el node_modules más
 *    cercano — que sería el de la raíz del repo (diseno-sorsabsa/node_modules,
 *    que también tiene React instalado como devDependency). Dos copias de
 *    React distintas en el mismo árbol = "Invalid hook call" en cualquier
 *    componente con hooks (Wordmark usa useContext, Input usa useId...).
 *    El alias fuerza AMBAS rutas de import a resolver siempre al mismo
 *    paquete físico (el de showcase/node_modules, que además es el único
 *    que existe en un deploy de Vercel con Root Directory = showcase, donde
 *    no hay node_modules de la raíz del repo).
 *
 * 3. resolve.alias de framer-motion/motion/lucide-react — ../src/components/*
 *    los importa normalmente; fuera del root de showcase, Rollup no puede
 *    resolverlos desde showcase/node_modules salvo que se los alisee
 *    explícitamente.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'framer-motion': path.resolve(__dirname, 'node_modules/framer-motion'),
      motion: path.resolve(__dirname, 'node_modules/motion'),
      'lucide-react': path.resolve(__dirname, 'node_modules/lucide-react'),
      '@tokens': path.resolve(__dirname, '../src/tokens.css'),
    },
    dedupe: ['react', 'react-dom', 'framer-motion', 'motion', 'lucide-react'],
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
});
