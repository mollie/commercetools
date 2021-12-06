module.exports = {
  rootDir: '../.',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/?(*.)+(test).+(ts|js)'],
  transform: {
    '^.+\\.(ts)$': 'ts-jest',
  },
  setupFiles: ['<rootDir>/tests/setEnvVars.js'],
};
