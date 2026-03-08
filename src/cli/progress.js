const progress = () => {
  const currentArgs = process.argv;

  const getArg = (name, def) => {
    const i = currentArgs.indexOf(name);
    return i !== -1 ? Number(currentArgs[i + 1]) : def;
  };

  const duration = getArg("--duration", 5000);
  const interval = getArg("--interval", 100);
  const length = getArg("--length", 30);

  const colorIndex = currentArgs.indexOf("--color");
  let colorCode = "";

  if (colorIndex !== -1) {
    const hex = currentArgs[colorIndex + 1];
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);

      colorCode = `\x1b[38;2;${r};${g};${b}m`;
      process.stdout.write(`\x1b[38;2;${r};${g};${b}mTEST COLOR\x1b[0m\n`);
    }
  }

  const steps = Math.floor(duration / interval);
  let current = 0;

  const timer = setInterval(() => {
    current++;

    const percent = Math.round((current / steps) * 100);

    const filled = Math.round((current / steps) * length);
    const empty = length - filled;

    const bar = colorCode + "█".repeat(filled) + "\x1b[0m" + " ".repeat(empty);

    process.stdout.write(`\r[${bar}] ${percent}%`);

    if (current >= steps) {
      clearInterval(timer);
      process.stdout.write("\nDone!\n");
    }
  }, interval);
};

progress();


