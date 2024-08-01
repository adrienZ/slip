import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: ["./src/index"],
  declaration: true,

  // we have warnings because we use publishConfig in package.json
  failOnWarn: false,
});
