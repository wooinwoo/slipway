// Request/response shapes shared with the web app. Keep in sync with
// templates/react/src/shared/api/auth.ts (in the mono preset both import one package).
import { z } from 'zod';

export const providers = ['email', 'guest', 'kakao', 'naver'] as const;
export type Provider = (typeof providers)[number];

export type User = {
  id: string;
  name: string;
  email: string;
  provider: Provider;
};

export const loginSchema = z.object({
  email: z.email('이메일 형식이 아닙니다'),
  password: z.string().min(1, '비밀번호를 입력하세요'),
});

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '이름을 입력하세요')
    .max(20, '20자 이하로 입력하세요'),
  email: z.email('이메일 형식이 아닙니다'),
  password: z.string().min(8, '8자 이상 입력하세요'),
});
