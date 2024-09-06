// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

export default defineEventHandler(async () => {
  // @ts-expect-error experimental typing is not working with test utils
  const auth = useSlipAuth();
  try {
    const validation = await auth.checkDbAndTables("sqlite");
    return { validation: validation };
  }
  catch {
    return { validation: false };
  }
});
