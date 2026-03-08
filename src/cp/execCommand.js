import { spawn } from "child_process";

const execCommand = () => {
  const input = process.argv[2];

  const [cmd, ...args] = input.split(" ");

  const child = spawn(cmd, args, {
    env: process.env,
  });

  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);

  child.on("close", (code) => {
    process.exit(code);
  });
};

execCommand();
