export default function env(name: string): string {
  const val = process.env[name];

  if (!val) throw new Error(`Missing environment variable ${name}`);

  return val;
}
