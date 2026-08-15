import { Injectable, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { getFirestore } from '../app/firebase-admin';

export interface StoredUser {
  uid: string;
  username: string;
  passwordHash: string; // scrypt: salt:hash (hex)
  createdAt: number;
}

export interface AuthResult {
  accessToken: string;
  uid: string;
  username: string;
  isNewUser: boolean;
}

const MIN_PASSWORD = 4;
const MIN_USERNAME = 3;
const USERS_COLLECTION = 'users';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly jwt: JwtService) {}

  async register(username: string, password: string): Promise<AuthResult> {
    this.validate(username, password);
    const key = username.toLowerCase();
    const db = getFirestore();

    // Check existing by usernameLower field
    const existing = await db
      .collection(USERS_COLLECTION)
      .where('usernameLower', '==', key)
      .limit(1)
      .get();
    if (!existing.empty) {
      throw new ConflictException('Username already taken');
    }

    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    const uid = `usr_${randomBytes(12).toString('hex')}`;

    const user: StoredUser = {
      uid,
      username,
      passwordHash: `${salt}:${hash}`,
      createdAt: Date.now(),
    };

    await db
      .collection(USERS_COLLECTION)
      .doc(uid)
      .set({ ...user, usernameLower: key });

    this.logger.log(`Registered: ${username} (uid=${uid})`);

    const accessToken = await this.jwt.signAsync({
      sub: uid,
      provider: 'password',
      username,
    });

    return { accessToken, uid, username, isNewUser: true };
  }

  async login(username: string, password: string): Promise<AuthResult> {
    const key = username.toLowerCase();
    const db = getFirestore();

    const snap = await db
      .collection(USERS_COLLECTION)
      .where('usernameLower', '==', key)
      .limit(1)
      .get();
    if (snap.empty) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const user = snap.docs[0].data() as StoredUser;
    const [salt, storedHash] = user.passwordHash.split(':');
    const hashBuf = Buffer.from(scryptSync(password, salt, 64));
    const storedBuf = Buffer.from(storedHash, 'hex');
    const ok = hashBuf.length === storedBuf.length && timingSafeEqual(hashBuf, storedBuf);

    if (!ok) {
      throw new UnauthorizedException('Invalid username or password');
    }

    this.logger.log(`Login: ${username} (uid=${user.uid})`);

    const accessToken = await this.jwt.signAsync({
      sub: user.uid,
      provider: 'password',
      username: user.username,
    });

    return { accessToken, uid: user.uid, username: user.username, isNewUser: false };
  }

  private validate(username: string, password: string) {
    if (!username || username.trim().length < MIN_USERNAME) {
      throw new UnauthorizedException(`Username must be at least ${MIN_USERNAME} characters`);
    }
    if (!password || password.length < MIN_PASSWORD) {
      throw new UnauthorizedException(`Password must be at least ${MIN_PASSWORD} characters`);
    }
  }
}
