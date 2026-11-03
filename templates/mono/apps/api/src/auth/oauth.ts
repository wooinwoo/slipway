// Kakao and Naver sign-in with plain fetch: authorize URL, code exchange, profile.
// Register `${API_URL}/api/auth/<provider>/callback` as the redirect URI in each console.
import { config } from '../config.js';

export type SocialProfile = { id: string; name: string; email?: string };
export const socialProviders = ['kakao', 'naver'] as const;
export type SocialProvider = (typeof socialProviders)[number];

const redirectUri = (provider: SocialProvider) =>
  `${config.API_URL}/api/auth/${provider}/callback`;

function credentials(provider: SocialProvider) {
  const id =
    provider === 'kakao' ? config.KAKAO_CLIENT_ID : config.NAVER_CLIENT_ID;
  const secret =
    provider === 'kakao'
      ? config.KAKAO_CLIENT_SECRET
      : config.NAVER_CLIENT_SECRET;
  return id ? { id, secret } : null;
}

export const isConfigured = (provider: SocialProvider) =>
  credentials(provider) !== null;

export function authorizeUrl(provider: SocialProvider, state: string) {
  const { id } = credentials(provider)!;
  const base =
    provider === 'kakao'
      ? 'https://kauth.kakao.com/oauth/authorize'
      : 'https://nid.naver.com/oauth2.0/authorize';
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: id,
    redirect_uri: redirectUri(provider),
    state,
  });
  return `${base}?${params}`;
}

async function json<T>(response: Response): Promise<T> {
  if (!response.ok)
    throw new Error(
      `${response.url} → ${response.status} ${await response.text()}`,
    );
  return (await response.json()) as T;
}

export async function fetchProfile(
  provider: SocialProvider,
  code: string,
  state: string,
): Promise<SocialProfile> {
  const { id, secret } = credentials(provider)!;
  const tokenUrl =
    provider === 'kakao'
      ? 'https://kauth.kakao.com/oauth/token'
      : 'https://nid.naver.com/oauth2.0/token';
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: id,
    redirect_uri: redirectUri(provider),
    code,
    state,
    ...(secret ? { client_secret: secret } : {}),
  });
  const { access_token } = await json<{ access_token: string }>(
    await fetch(tokenUrl, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  );
  const auth = { headers: { Authorization: `Bearer ${access_token}` } };

  if (provider === 'kakao') {
    // account_email is only granted to verified business apps, so it is often missing.
    const me = await json<{
      id: number;
      kakao_account?: { email?: string; profile?: { nickname?: string } };
    }>(await fetch('https://kapi.kakao.com/v2/user/me', auth));
    return {
      id: String(me.id),
      name: me.kakao_account?.profile?.nickname ?? '카카오 사용자',
      email: me.kakao_account?.email,
    };
  }
  const me = await json<{
    response: { id: string; name?: string; nickname?: string; email?: string };
  }>(await fetch('https://openapi.naver.com/v1/nid/me', auth));
  return {
    id: me.response.id,
    name: me.response.name ?? me.response.nickname ?? '네이버 사용자',
    email: me.response.email,
  };
}
