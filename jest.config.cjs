/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // .ts además de .tsx: hasta hoy solo corrían las pruebas de componentes, así
  // que un test de una función pura (src/lib/**) se escribía y jest lo
  // ignoraba en silencio — peor que no tenerlo.
  testMatch: ['<rootDir>/src/**/*.test.ts?(x)'],
};
