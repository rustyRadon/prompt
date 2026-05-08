import { createMocks } from 'node-mocks-http';
import handler from '../../src/app/api/chat/route';

describe('API Integration Tests', () => {
  describe('/api/chat', () => {
    test('should handle POST request', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          message: 'Hello, how are you?'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data).toHaveProperty('message', 'Chat endpoint');
    });

    test('should handle GET request', async () => {
      const { req, res } = createMocks({
        method: 'GET'
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data).toHaveProperty('message', 'Chat API endpoint');
    });

    test('should handle invalid JSON', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: 'invalid json'
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data).toHaveProperty('error', 'Internal server error');
    });

    test('should handle empty body', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data).toHaveProperty('message', 'Chat endpoint');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing method', async () => {
      const { req, res } = createMocks({});

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    test('should handle malformed request', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: null
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
    });
  });

  describe('Request Validation', () => {
    test('should accept valid message format', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          message: 'Test message',
          userId: 'user123',
          context: 'Some context'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    test('should handle very long messages', async () => {
      const longMessage = 'a'.repeat(10000);
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          message: longMessage
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    test('should handle special characters', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          message: 'Hello 🌍! How are you today? @#$%^&*()'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });
});
