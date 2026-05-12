/**
 * Auth Middleware for Sub-Apps
 * Receives JWT from Core App Gateway and decodes it.
 */
export const extractCoreUser = (req: any, res: any, next: any) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing Core JWT Token' });

  // Mock JWT Decoding - In production use jsonwebtoken library
  try {
    // Expecting Base64 encoded payload from Core
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    req.coreUser = payload; // Contains user ID, roles, etc.
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid Core Token' });
  }
};
