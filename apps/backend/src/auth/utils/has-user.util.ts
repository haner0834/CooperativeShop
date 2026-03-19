import { Account, AuthSession, User } from '@prisma/client';

type AuthSessionWithAccount = AuthSession & {
  account: Account & {
    user: User;
  };
};

export function hasUser(
  s: AuthSessionWithAccount,
): s is typeof s & { account: { user: NonNullable<typeof s.account.user> } } {
  return s.account?.user != null;
}
