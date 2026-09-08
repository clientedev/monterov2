import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { mkdir, readFile, rm, cp } from "fs/promises";

// Server dependencies are bundled to reduce openat(2) syscalls and improve
// cold-start times. These packages remain external in the production bundle.
const allowlist = [
  "@google/generative-ai",
  "axios",
  "cors",
  "date-fns",
  "jsonwebtoken",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  await mkdir("dist/migrations", { recursive: true });
  await cp("migrations", "dist/migrations", { recursive: true });

  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    external: externals,
    minify: false,
    logLevel: "info",
  });
  console.log("server build completed.");
}

console.log("Starting build process...");
buildAll()
  .then(() => {
    console.log("All builds completed successfully!");
  })
  .catch((err) => {
    console.error("Build failed:", err);
    process.exit(1);
  });