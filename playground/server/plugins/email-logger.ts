// ONLY FOR DEMO PURPOSE, UNSAFE TO USE IN PRODUCTION!
export default defineNitroPlugin(() => {
  const auth = useSlipAuth();

  auth.hooks.hookOnce("emailVerificationCode:create", (code) => {
    console.log(`VERIFICATION CODE FOR EMAIL ${code.email} : ${code.code}`);
  });

  auth.hooks.hookOnce("resetPasswordToken:create", (token) => {
    console.log(`PASSWORD TOKEN FOR USER ${token.user_id} : ${token.token_hash}`);
  });

  auth.hooks.hookOnce("emailVerificationCode:delete", (code) => {
    console.log(`VERIFICATION VALIDATED FOR EMAIL ${code.email} with code ${code.code}`);
  });
});
