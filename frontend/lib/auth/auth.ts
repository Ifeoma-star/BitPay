import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { JWTPayload } from '@/types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'thisis_bitpay_@_streaming_for_bitcoin4stx';

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

export const getTokenFromRequest = (request: NextRequest): string | null => {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies
  const token = request.cookies.get('auth-token')?.value;
  return token || null;
};

export const generateVerificationToken = (): string => {
  return jwt.sign(
    { type: 'verification', timestamp: Date.now() },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

export const generateResetToken = (): string => {
  return jwt.sign(
    { type: 'reset', timestamp: Date.now() },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Client-side token management - cookies are handled by server
// Frontend only needs to read cookies, not set them
export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const cookies = document.cookie.split(';');
  const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth-token='));
  return authCookie ? decodeURIComponent(authCookie.split('=')[1]) : null;
};

export const setStoredToken = (token: string): void => {
  // No-op: tokens are set as httpOnly cookies by the server
  // This function exists for compatibility but doesn't do anything
  console.log('Token storage handled by server-side cookies');
};

export const removeStoredToken = (): void => {
  if (typeof window === 'undefined') return;
  // Clear cookie by calling logout endpoint
  document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};

export const getStoredRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const cookies = document.cookie.split(';');
  const refreshCookie = cookies.find(cookie => cookie.trim().startsWith('refresh-token='));
  return refreshCookie ? decodeURIComponent(refreshCookie.split('=')[1]) : null;
};

export const setStoredRefreshToken = (refreshToken: string): void => {
  // No-op: refresh tokens are set as httpOnly cookies by the server
  console.log('Refresh token storage handled by server-side cookies');
};

export const removeStoredRefreshToken = (): void => {
  if (typeof window === 'undefined') return;
  document.cookie = 'refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};

export const isAuthenticated = (): boolean => {
  // Since we use httpOnly cookies, we can't check auth status client-side
  // This function is now deprecated - use the useAuth hook instead
  console.warn('isAuthenticated() is deprecated with httpOnly cookies. Use useAuth hook instead.');
  return false;
};

export const clearAuthTokens = (): void => {
  removeStoredToken();
  removeStoredRefreshToken();
};