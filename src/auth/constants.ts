export const jwtConstants = {
  secret:
    process.env.JWT_SECRET ||
    'd2ddab951db1925f692d811b6153d1cbf49e1ff009d2b935ebc2663abfe1a918ec8e702b19d082feb606adb3c68ee557b4a21ded0c47aa7b035714c8bfd37b83',
  refreshSecret:
    process.env.JWT_REFRESH_SECRET ||
    'ebcdf58d5193543e2a9ce17aa08a1a3a82e6e46891b8320cca951fc1f531c25c5bbcaa30a28467427c5b8f6c813ae406e03c93003cb3921f04bee4ec1f4e8c1f',
  accessTokenExpiration: process.env.JWT_ACCESS_EXPIRATION || '3600',
  refreshTokenExpiration: process.env.JWT_REFRESH_EXPIRATION || '86400',
} as const;
