const jwt = require('jsonwebtoken');

class JWTService {
  constructor() {
    this.secretKey = process.env.JWT_SECRET_KEY || 'fallback-secret-key';
    this.algorithm = process.env.JWT_ALGORITHM || 'HS256';
    this.accessTokenExpiry = process.env.JWT_ACCESS_TOKEN_EXPIRE_MINUTES || 30;
    this.refreshTokenExpiry = process.env.JWT_REFRESH_TOKEN_EXPIRE_DAYS || 7;
  }

  generateAccessToken(payload) {
    const options = {
      expiresIn: `${this.accessTokenExpiry}m`,
      algorithm: this.algorithm
    };

    return jwt.sign(payload, this.secretKey, options);
  }

  generateRefreshToken(payload) {
    const options = {
      expiresIn: `${this.refreshTokenExpiry}d`,
      algorithm: this.algorithm
    };

    return jwt.sign(payload, this.secretKey, options);
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.secretKey);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      throw new Error('Invalid token format');
    }
  }

  generateTokenPair(user) {
    const payload = {
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken({ userId: user._id });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTokenExpiry * 60 // Convert to seconds
    };
  }
}

module.exports = new JWTService();
