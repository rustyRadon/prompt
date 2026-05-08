import { User } from '../types';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export class AuthService {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, { userId: string; expiresAt: Date }> = new Map();

  async register(data: RegisterData): Promise<AuthResult> {
    try {
      // Check if user already exists
      if (this.users.has(data.email)) {
        return {
          success: false,
          error: 'User already exists'
        };
      }

      // Create new user
      const user: User = {
        id: this.generateUserId(),
        email: data.email,
        name: data.name,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.users.set(user.email, user);

      // Generate session token
      const token = this.generateToken();
      this.sessions.set(token, {
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      return {
        success: true,
        user,
        token
      };
    } catch (error) {
      return {
        success: false,
        error: 'Registration failed'
      };
    }
  }

  async login(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      const user = this.users.get(credentials.email);
      
      if (!user) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // In a real implementation, you'd verify the password hash
      // For now, we'll just check if the email exists

      // Generate session token
      const token = this.generateToken();
      this.sessions.set(token, {
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      return {
        success: true,
        user,
        token
      };
    } catch (error) {
      return {
        success: false,
        error: 'Login failed'
      };
    }
  }

  async validateToken(token: string): Promise<User | null> {
    const session = this.sessions.get(token);
    
    if (!session) {
      return null;
    }

    // Check if session has expired
    if (session.expiresAt < new Date()) {
      this.sessions.delete(token);
      return null;
    }

    // Find user by ID
    for (const user of this.users.values()) {
      if (user.id === session.userId) {
        return user;
      }
    }

    return null;
  }

  async logout(token: string): Promise<boolean> {
    return this.sessions.delete(token);
  }

  async refreshToken(token: string): Promise<string | null> {
    const session = this.sessions.get(token);
    
    if (!session) {
      return null;
    }

    // Check if session has expired
    if (session.expiresAt < new Date()) {
      this.sessions.delete(token);
      return null;
    }

    // Generate new token and invalidate old one
    this.sessions.delete(token);
    const newToken = this.generateToken();
    this.sessions.set(newToken, {
      userId: session.userId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    return newToken;
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    // In a real implementation, you'd verify the old password and update the hash
    // For now, we'll just return true
    return true;
  }

  async deleteUser(userId: string): Promise<boolean> {
    // Find and delete user
    for (const [email, user] of this.users.entries()) {
      if (user.id === userId) {
        this.users.delete(email);
        
        // Delete all sessions for this user
        for (const [token, session] of this.sessions.entries()) {
          if (session.userId === userId) {
            this.sessions.delete(token);
          }
        }
        
        return true;
      }
    }
    
    return false;
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateToken(): string {
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup expired sessions
  cleanupExpiredSessions(): void {
    const now = new Date();
    
    for (const [token, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(token);
      }
    }
  }

  // Get user by ID
  async getUserById(userId: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.id === userId) {
        return user;
      }
    }
    return null;
  }

  // Update user profile
  async updateUser(userId: string, updates: Partial<Pick<User, 'name'>>): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.id === userId) {
        const updatedUser = {
          ...user,
          ...updates,
          updatedAt: new Date()
        };
        this.users.set(user.email, updatedUser);
        return updatedUser;
      }
    }
    return null;
  }
}
