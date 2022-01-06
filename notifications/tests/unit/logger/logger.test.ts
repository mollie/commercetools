import Logger from '../../../src/logger/logger';

describe('Logger', () => {
  it('Default Logger should have the settings: level = info, transport = console', () => {
    expect(Logger.level).toBe('info');
    expect(Logger.transports).toHaveLength(1);
  });
});
