// @ts-expect-error experimental feature
import { defineTask, type runTask } from "#imports";
import { useSlipAuth } from "../../../utils/useSlipAuth";

type FixedTaskEvent = Required<NonNullable<Parameters<typeof runTask>[1]>>;

export default defineTask({
  meta: {
    name: "slip:db:expired-sessions",
    description: "Delete expired items in session's table",
  },
  async run({ payload }: FixedTaskEvent) {
    const scheduledTime = payload.scheduledTime as number;
    console.log("Running SLIP expired sessions task...", scheduledTime);
    const auth = useSlipAuth();
    const deletions = await auth.deleteExpiredSessions(scheduledTime);
    console.log("Ending SLIP expired sessions task...", deletions);
    return { result: deletions };
  },
});
