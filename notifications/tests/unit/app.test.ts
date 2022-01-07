import request from 'supertest';
import app from '../../src/app';

describe('Health check', () => {
  it('Should have /health endpoint to check', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
  });
});
