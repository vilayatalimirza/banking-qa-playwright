export interface DemoPreflightResult {
  up: boolean;
  detail: string;
}

/**
 * Accept only the actual ParaBank home page, not an error/challenge page that happens
 * to contain the word "Register". This keeps a bad environment from turning into
 * dozens of slow locator timeouts during fixture setup.
 */
export function inspectDemoHome(status: number, body: string): DemoPreflightResult {
  if (status !== 200) {
    return { up: false, detail: `HTTP ${status}` };
  }

  const hasRegisterLink =
    /<a\b[^>]*href\s*=\s*["'][^"']*register\.htm[^"']*["'][^>]*>[\s\S]*?\bRegister\b[\s\S]*?<\/a>/i.test(body);

  return hasRegisterLink
    ? { up: true, detail: 'HTTP 200; Register link present' }
    : { up: false, detail: 'HTTP 200 but no Register navigation link (error or challenge page?)' };
}
