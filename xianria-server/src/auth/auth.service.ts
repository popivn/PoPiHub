import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { firestoreGetDoc, firestoreSet, firestoreWhere } from '../firebase/firebase-admin';
import type { User } from './user.entity';
import { RegisterDto, LoginDto, GuestDto } from './auth.dto';

const USERS_COLLECTION = 'users';
const JWT_SECRET = process.env.JWT_SECRET ?? 'xianria-dev-secret-change-me';
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';

type AuthResponse = { token: string; user: Omit<User, 'passwordHash'>; launchUrl: string };

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await firestoreWhere(USERS_COLLECTION, 'username', 'EQUAL', dto.username);
    if (existing.length > 0) {
      throw new ConflictException('Username already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const uid = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const user: User = {
      uid,
      username: dto.username,
      passwordHash,
      isGuest: false,
      coins: 1000,
      createdAt: Date.now(),
    };

    await firestoreSet(USERS_COLLECTION, uid, {
      uid,
      username: dto.username,
      passwordHash,
      isGuest: false,
      coins: 1000,
      createdAt: Date.now(),
    });

    return this.issueToken(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const results = await firestoreWhere(USERS_COLLECTION, 'username', 'EQUAL', dto.username);
    if (results.length === 0) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const user = results[0] as User;
    if (user.isGuest || !user.passwordHash) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    return this.issueToken(user);
  }

  async guest(dto: GuestDto): Promise<AuthResponse> {
    const uid = `gst_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const user: User = {
      uid,
      username: dto.nickname ?? `Guest_${uid.slice(-6)}`,
      passwordHash: null,
      isGuest: true,
      coins: 500,
      createdAt: Date.now(),
    };

    await firestoreSet(USERS_COLLECTION, uid, {
      uid,
      username: user.username,
      passwordHash: null,
      isGuest: true,
      coins: 500,
      createdAt: Date.now(),
    });

    return this.issueToken(user);
  }

  async verifyToken(token: string): Promise<{ valid: boolean; user: Omit<User, 'passwordHash'> | null; launchUrl: string | null }> {
    try {
      const payload = this.jwtService.verify(token, { secret: JWT_SECRET });
      const uid = payload.sub;
      const doc = await firestoreGetDoc(USERS_COLLECTION, uid);
      if (!doc) return { valid: false, user: null, launchUrl: null };
      const user = doc as User;
      if (user.coins === undefined || user.coins === null) user.coins = 0;
      const { passwordHash, ...safeUser } = user;
      const launchUrl = `${CLIENT_URL}/#/game?token=${token}`;
      return { valid: true, user: safeUser, launchUrl };
    } catch {
      return { valid: false, user: null, launchUrl: null };
    }
  }

  private issueToken(user: User): AuthResponse {
    const payload = {
      sub: user.uid,
      username: user.username,
      isGuest: user.isGuest,
    };
    const token = this.jwtService.sign(payload, { secret: JWT_SECRET });
    if (user.coins === undefined || user.coins === null) user.coins = 0;
    const { passwordHash, ...safeUser } = user;
    const launchUrl = `${CLIENT_URL}/#/game?token=${token}`;
    return { token, user: safeUser, launchUrl };
  }
}
