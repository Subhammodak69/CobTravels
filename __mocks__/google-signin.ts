export const GoogleSignin = {
  configure: jest.fn(),
  hasPlayServices: jest.fn(async () => true),
  signIn: jest.fn(async () => ({type: 'cancelled'})),
  getTokens: jest.fn(async () => ({idToken: null, accessToken: null})),
};

export const statusCodes = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
};

export const isErrorWithCode = (error: any) => Boolean(error?.code);
