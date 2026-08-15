import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getAuth } from '../app/firebase-admin';

export interface AuthResult {
  accessToken: string;
  uid: string;
  isNewUser: boolean;
}

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  /**
   * Tạo (hoặc lấy) anonymous user qua Firebase Admin SDK.
   * Trả về JWT session do server ký — client dùng JWT này cho các request sau.
   *
   * Lưu ý: Firebase Admin không có hàm "signIn anonymously" như client SDK.
   * Ta tạo user anonymous mới mỗi lần gọi. Nếu muốn reuse, client phải gửi
   * lại uid cũ (lưu ở localStorage) và ta dùng createCustomToken hoặc
   * verifyIdToken thay vì tạo mới.
   */
  async anonymousSignIn(existingUid?: string): Promise<AuthResult> {
    const auth = getAuth();

    let uid: string;
    let isNewUser: boolean;

    if (existingUid) {
      // Reuse anonymous user đã có — verify nó tồn tại
      try {
        await auth.getUser(existingUid);
        uid = existingUid;
        isNewUser = false;
      } catch {
        // uid không tồn tại nữa → tạo mới
        const user = await auth.createUser({ disabled: false });
        uid = user.uid;
        isNewUser = true;
      }
    } else {
      const user = await auth.createUser({ disabled: false });
      uid = user.uid;
      isNewUser = true;
    }

    const accessToken = await this.jwt.signAsync({
      sub: uid,
      provider: 'anonymous',
    });

    return { accessToken, uid, isNewUser };
  }

  /**
   * Verify JWT do server ký (dùng cho JwtAuthGuard).
   */
  async verifyAccessToken(token: string): Promise<{ sub: string; provider: string }> {
    try {
      const payload = await this.jwt.verifyAsync(token);
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
