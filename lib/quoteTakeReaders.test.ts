/**
 * Any site code that reads OrderBook.quoteTake reads it the way the v9 contracts define it.
 *
 * WHY. callhouse-contracts made `quoteTake` run `take`'s own code and roll it
 * back: same selector (0xe2e13f01), same returns, but `view` became `nonpayable`, and the taker is msg.sender, so an
 * eth_call with no `from` (address(0)) reverts NotAuthorized. A reader typed against the old view ABI
 * (`readContract`, which sends no account) would now revert for every visitor. At this base the site has NO such
 * reader: its payoff cards are priced from the indexer API (lib/live.ts) and lib/payoff.ts only NAMES quoteTake in a
 * comment ("quoteTake remains authoritative before a trade"), in the byte twin of callhouse web/lib/v2/payoff.ts.
 *
 * HOW. Every site source file is lexed (comments blanked; strings, templates and regex literals known, so a comment
 * marker inside one is not a comment). Each code mention of `quoteTake` must sit INSIDE the parentheses of a
 * `simulateContract(...)` / `useSimulateContract(...)` call that passes an `account`, or inside an
 * `encodeFunctionData(...)` that is itself inside a `call(...)` passing an `account` (an eth_call with a `from`).
 * The scanner is checked against the wrong shapes and the right ones before it is trusted on the tree, so an empty
 * result means "no reader", not "the scan did not run".
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const SCANNED_DIRS = ["app", "components", "lib", "scripts"];
const SOURCE = /\.(ts|tsx|mts|mjs|js)$/;
const TEST = /\.test\.(ts|tsx|mts|mjs)$/;

/**
 * A `/` here starts a regex literal, not a division: after an operator, an opening bracket, or one of these words.
 * Not after `<` or `}`: in .tsx those are a JSX closing tag (`</p>`) and a self-closing tag after a prop (`{x} />`).
 * After `)` only when that `)` closes an if/while/for/with condition (`if (x) /re/.test(s)`); otherwise it divides.
 */
const REGEX_AFTER_CHAR = /[(,=:[!&|?{;+\-*%>~^]/;
const REGEX_AFTER_WORD = /(?:^|[^\w$])(?:return|typeof|case|do|else|in|of|void|yield|await|delete|throw|new)$/;

/**
 * `code`: `source` with every comment blanked to spaces. `shape`: `code` with string, template and regex contents
 * blanked too, for bracket matching. Newlines are kept and nothing moves, so an offset in either is an offset in the
 * file. Because the lexer knows strings, an unclosed `/*` inside one ("src/*") cannot swallow the code after it.
 */
export function lex(source: string): { code: string; shape: string } {
  const n = source.length;
  const code = source.split("");
  const shape = source.split("");
  const blank = (from: number, to: number, inCode: boolean) => {
    for (let k = from; k < to; k++) {
      if (source[k] === "\n") continue;
      shape[k] = " ";
      if (inCode) code[k] = " ";
    }
  };
  const holes: number[] = []; // brace depth each open template `${` closes back to
  let depth = 0;
  let prev = ""; // last code character that is not whitespace
  const parens: boolean[] = []; // per open code "(": whether it opens an if/while/for/with condition
  let afterCondition = false; // the last code ")" closed such a condition, so a "/" right after it starts a regex
  // Template text from `from`: returns the index after the closing backtick, or after a `${` that opens a hole.
  const template = (from: number): number => {
    let k = from;
    while (k < n) {
      if (source[k] === "\\") k += 2;
      else if (source[k] === "`") break;
      else if (source[k] === "$" && source[k + 1] === "{") {
        blank(from, k, false);
        holes.push(depth);
        depth++;
        return k + 2;
      } else k++;
    }
    blank(from, Math.min(k, n), false);
    return k + 1;
  };
  let i = 0;
  while (i < n) {
    const c = source[i];
    const next = source[i + 1];
    if (c === "/" && next === "/") {
      let end = source.indexOf("\n", i);
      if (end < 0) end = n;
      blank(i, end, true);
      i = end;
      continue;
    }
    if (c === "/" && next === "*") {
      const close = source.indexOf("*/", i + 2);
      const end = close < 0 ? n : close + 2;
      blank(i, end, true);
      i = end;
      continue;
    }
    if (c === '"' || c === "'") {
      let k = i + 1;
      while (k < n && source[k] !== c && source[k] !== "\n") k += source[k] === "\\" ? 2 : 1;
      blank(i + 1, Math.min(k, n), false);
      i = k + 1;
      prev = c;
      continue;
    }
    if (c === "`") {
      i = template(i + 1);
      prev = "`";
      continue;
    }
    const regexHere = () =>
      prev === "" ||
      REGEX_AFTER_CHAR.test(prev) ||
      (prev === ")" && afterCondition) ||
      REGEX_AFTER_WORD.test(source.slice(Math.max(0, i - 12), i).trimEnd());
    if (c === "/" && regexHere()) {
      let k = i + 1;
      let inClass = false;
      while (k < n && source[k] !== "\n" && (inClass || source[k] !== "/")) {
        if (source[k] === "\\") k++;
        else if (source[k] === "[") inClass = true;
        else if (source[k] === "]") inClass = false;
        k++;
      }
      if (k < n && source[k] === "/") {
        blank(i + 1, k, false);
        i = k + 1;
        prev = "/";
        continue;
      }
    }
    if (c === "(") parens.push(/(?:^|[^\w$])(?:if|while|for|with)\s*$/.test(source.slice(Math.max(0, i - 8), i)));
    if (c === ")") afterCondition = parens.pop() ?? false;
    if (c === "{") depth++;
    if (c === "}") {
      depth--;
      if (holes.length > 0 && holes[holes.length - 1] === depth) {
        holes.pop();
        i = template(i + 1);
        prev = "`";
        continue;
      }
    }
    if (!/\s/.test(c)) prev = c;
    i++;
  }
  return { code: code.join(""), shape: shape.join("") };
}

const OPENER: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

/** Whether every bracket in `shape` closes the bracket it should: if not, the lexer misread the file. */
function balanced(shape: string): boolean {
  const open: string[] = [];
  for (const ch of shape) {
    if (ch === "(" || ch === "[" || ch === "{") open.push(ch);
    else if (ch in OPENER && open.pop() !== OPENER[ch]) return false;
  }
  return open.length === 0;
}

/** A call whose parentheses enclose an offset: its name (the identifier before `(`) and its `(` and matching `)`. */
type Call = { name: string; open: number; close: number };

/** The calls whose parentheses enclose `at`, innermost first (brackets read from `shape`, so strings do not count). */
function enclosingCalls(shape: string, at: number): Call[] {
  const calls: Call[] = [];
  let depth = 0;
  for (let k = at - 1; k >= 0; k--) {
    if (shape[k] === ")") depth++;
    else if (shape[k] === "(" && depth > 0) depth--;
    else if (shape[k] === "(") {
      const head = shape.slice(Math.max(0, k - 64), k).replace(/<[^<>()]*>\s*$/, ""); // drop one generic: f<T>(
      const name = /([\w$]*)\s*$/.exec(head)?.[1] ?? "";
      let close = k + 1;
      for (let open = 1; close < shape.length; close++) {
        if (shape[close] === "(") open++;
        else if (shape[close] === ")" && --open === 0) break;
      }
      calls.push({ name, open: k, close });
    }
  }
  return calls;
}

/** Whether `call` passes an `account` of its own: a key or shorthand at the top level of its argument object. */
function passesAccount(code: string, shape: string, call: Call): boolean {
  for (const match of code.slice(call.open, call.close).matchAll(/\baccount\b/g)) {
    const at = call.open + (match.index ?? 0);
    let depth = 0;
    for (let k = call.open + 1; k < at; k++) {
      if ("{[(".includes(shape[k])) depth++;
      else if ("}])".includes(shape[k])) depth--;
    }
    const before = shape.slice(call.open + 1, at).trimEnd().slice(-1);
    const empty = /^account\s*:\s*(?:undefined|null)\b/.test(code.slice(at)); // sends no `from` either
    if (depth === 1 && (before === "{" || before === ",") && !empty) return true;
  }
  return false;
}

/** One code mention of quoteTake that is not a simulated call with an account. */
export type BadRead = { file: string; offset: number; reason: string };

const SIMULATE = new Set(["simulateContract", "useSimulateContract"]);
const NOT_SIMULATED = "quoteTake is nonpayable since T-OP-835: read it with simulateContract";
const NO_ACCOUNT = "quoteTake needs an account: with no `from` the taker is address(0) and it reverts NotAuthorized";
const UNREADABLE = "the scanner cannot pair this file's brackets, so it cannot tell which call holds quoteTake: check it by hand";

/** The mentions of `quoteTake` in `source` (comments blanked) that would not survive the nonpayable quoteTake ABI. */
export function badQuoteTakeReads(file: string, source: string): BadRead[] {
  const { code, shape } = lex(source);
  const mentions = [...code.matchAll(/quoteTake/g)].map((match) => match.index ?? 0);
  // The verdict below rests on bracket pairing; a file the lexer misread is refused, never passed.
  if (mentions.length > 0 && !balanced(shape)) return mentions.map((offset) => ({ file, offset, reason: UNREADABLE }));
  const bad: BadRead[] = [];
  for (const at of mentions) {
    const [inner, outer] = enclosingCalls(shape, at);
    // The call that carries the account: the simulate itself, or the eth_call around an encoded quoteTake.
    const carrier =
      inner && SIMULATE.has(inner.name) ? inner
      : inner?.name === "encodeFunctionData" && outer?.name === "call" ? outer
      : undefined;
    if (!carrier) bad.push({ file, offset: at, reason: NOT_SIMULATED });
    else if (!passesAccount(code, shape, carrier)) bad.push({ file, offset: at, reason: NO_ACCOUNT });
  }
  return bad;
}

function sources(dir: string): string[] {
  return readdirSync(join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "node_modules" ? [] : sources(path);
    return SOURCE.test(entry.name) && !TEST.test(entry.name) ? [path] : [];
  });
}

/** The reasons the scanner gives for `source`, one per bad mention. */
const reasons = (source: string) => badQuoteTakeReads("x.ts", source).map((read) => read.reason);

describe("quoteTake readers", () => {
  it("the scanner refuses every shape the old view ABI allowed, and accepts a simulate with an account", () => {
    const viewRead = `await client.readContract({ address, abi, functionName: "quoteTake", args: [params] });`;
    const noAccount = `await client.simulateContract({ address, abi, functionName: "quoteTake", args: [params] });`;
    const withAccount = `await client.simulateContract({ address, abi, functionName: "quoteTake", args: [params], account });`;
    const rawCall = `const data = encodeFunctionData({ abi, functionName: "quoteTake", args: [params] });`;
    const commentOnly = `/** quoteTake remains authoritative before a trade. */\nexport const x = 1; // quoteTake`;
    assert.match(badQuoteTakeReads("a.ts", viewRead)[0]?.reason ?? "", /read it with simulateContract/);
    assert.match(badQuoteTakeReads("b.ts", noAccount)[0]?.reason ?? "", /needs an account/);
    assert.match(badQuoteTakeReads("c.ts", rawCall)[0]?.reason ?? "", /read it with simulateContract/);
    assert.deepEqual(badQuoteTakeReads("d.ts", withAccount), []);
    assert.deepEqual(badQuoteTakeReads("e.ts", commentOnly), []);
  });

  // A mention is judged by the call it is INSIDE, not the nearest call before it.
  it("a quoteTake outside the simulate's parentheses is refused, even right after a simulate with an account", () => {
    const unrelated = `await client.simulateContract({ address, abi, functionName: "take", args: [params], account });\n`;
    const rawCall = `const data = encodeFunctionData({ abi, functionName: "quoteTake", args: [params] });`;
    const viewRead = `await client.readContract({ address, abi, functionName: "quoteTake", args: [params] });`;
    const filler = `const pad = 0;\n`.repeat(40); // pushes the encode past the old 400-character window
    assert.ok(filler.length > 400);
    assert.deepEqual(reasons(unrelated + filler + rawCall), [NOT_SIMULATED], "raw encode far after the simulate");
    assert.deepEqual(reasons(unrelated + rawCall), [NOT_SIMULATED], "raw encode right after the simulate");
    assert.deepEqual(reasons(unrelated + viewRead), [NOT_SIMULATED], "view read right after the simulate");
    const accountBefore = `await client.simulateContract({ abi, functionName: "take", account });\n`;
    const noAccount = `await client.simulateContract({ address, abi, functionName: "quoteTake", args: [params] });`;
    assert.deepEqual(reasons(accountBefore + noAccount), [NO_ACCOUNT], "an earlier call's account does not count");
    const accountInArgs = `await client.simulateContract({ address, abi, functionName: "quoteTake", args: [account] });`;
    assert.deepEqual(reasons(accountInArgs), [NO_ACCOUNT], "an account inside args is not the call's account");
  });

  // Only the call's own account key counts, including `account: undefined`, which sends no from.
  it("only the call's own account key counts: not from:, not an account one level down, not account: undefined", () => {
    const simulate = (extra: string) =>
      `await client.simulateContract({ address, abi, functionName: "quoteTake", args: [params]${extra} });`;
    assert.deepEqual(reasons(simulate(", account")), [], "shorthand");
    assert.deepEqual(reasons(simulate(", account: wallet.account")), [], "key");
    assert.deepEqual(reasons(simulate(", from: account")), [NO_ACCOUNT], "from: is not viem's account parameter");
    assert.deepEqual(reasons(simulate(", overrides: { account: taker }")), [NO_ACCOUNT], "an account key one level down");
    assert.deepEqual(reasons(simulate(", account: undefined")), [NO_ACCOUNT], "account: undefined sends no from");
    assert.deepEqual(reasons(simulate(", account: null")), [NO_ACCOUNT], "account: null sends no from");
    const ethCallFrom = `await client.call({ to: book, from: account, data: encodeFunctionData({ abi, functionName: "quoteTake", args: [params] }) });`;
    assert.deepEqual(reasons(ethCallFrom), [NO_ACCOUNT], "an eth_call's from: is not viem's account parameter");
  });

  // Comment markers inside strings, templates and regex literals are not comments.
  it("a comment marker inside a string, template or regex literal hides no code", () => {
    const viewRead = `await client.readContract({ address, abi, functionName: "quoteTake", args: [params] });`;
    for (const opener of [`const glob = "src/*";`, "const glob = `src/*`;", `const glob = 'src/*';`, `const re = /a\\/*b/;`]) {
      const hiding = `${opener}\n${viewRead}\nconst tail = 1; /* the next comment */`;
      assert.deepEqual(reasons(hiding), [NOT_SIMULATED], opener);
    }
    const keyComment = `const o = {\n  key: // note: a /* here opens nothing\n    1,\n};\n${viewRead}\nconst tail = 1; /* the next comment */`;
    assert.deepEqual(reasons(keyComment), [NOT_SIMULATED], "a // comment after key: hides no code (round 2 P3)");
    const keyProse = `const o = {\n  key: // quoteTake is only named here\n    1,\n};`;
    assert.deepEqual(reasons(keyProse), [], "a // comment after key: is a comment, so its quoteTake is prose");
    const afterIf = `if (ok) /a\\/*b/.test(s);\n${viewRead}\nconst tail = 1; /* the next comment */`;
    assert.deepEqual(reasons(afterIf), [NOT_SIMULATED], "a regex right after an if (...) condition");
    const url = `const u = "https://example.com"; ${viewRead}`;
    assert.deepEqual(reasons(url), [NOT_SIMULATED], "a // inside a string");
    const hole = "const s = `${a ? `x/*` : \"y\"}`;\n" + viewRead + "\nconst tail = 1; /* the next comment */";
    assert.deepEqual(reasons(hole), [NOT_SIMULATED], "a /* inside a template nested in a template hole");
    const parens = `await client.simulateContract({ abi, memo: "(", functionName: "quoteTake", args: [params], account });`;
    assert.deepEqual(reasons(parens), [], "a bracket inside a string does not move the call's end");
    const jsx = `const el = <Section intro={<p>{text}</p>} />;\n` + `const q = useSimulateContract({ abi, functionName: "quoteTake", args: [params], account });`;
    assert.deepEqual(reasons(jsx), [], "a JSX closing tag and a self-closing tag are not regex literals");
    const withAccount = `await client.simulateContract({ address, abi, functionName: "quoteTake", args: [params], account });`;
    assert.deepEqual(reasons(`const broken = (;\n${withAccount}`), [UNREADABLE], "a file whose brackets do not pair is refused");
  });

  // An eth_call with a `from` and wagmi's simulate hook are correct reads, not failures.
  it("an eth_call carrying an account and useSimulateContract with an account are accepted", () => {
    const ethCall = `await client.call({ account, to: book, data: encodeFunctionData({ abi, functionName: "quoteTake", args: [params] }) });`;
    const ethCallNoFrom = `await client.call({ to: book, data: encodeFunctionData({ abi, functionName: "quoteTake", args: [params] }) });`;
    const hook = `const q = useSimulateContract({ address, abi, functionName: "quoteTake", args: [params], account });`;
    const hookNoAccount = `const q = useSimulateContract({ address, abi, functionName: "quoteTake", args: [params] });`;
    assert.deepEqual(reasons(ethCall), []);
    assert.deepEqual(reasons(ethCallNoFrom), [NO_ACCOUNT]);
    assert.deepEqual(reasons(hook), []);
    assert.deepEqual(reasons(hookNoAccount), [NO_ACCOUNT]);
    const generic = `await client.simulateContract<typeof abi>({ address, abi, functionName: "quoteTake", args: [params], account });`;
    assert.deepEqual(reasons(generic), [], "a generic simulateContract<T>(...) (round 2 P4)");
  });

  it("the scan covers the site's source, including the one file that names quoteTake", () => {
    const files = SCANNED_DIRS.flatMap(sources);
    assert.ok(files.includes(join("lib", "payoff.ts")), "lib/payoff.ts is scanned");
    const naming = files.filter((file) => readFileSync(join(root, file), "utf8").includes("quoteTake"));
    assert.ok(naming.includes(join("lib", "payoff.ts")), "the scan sees the comment in lib/payoff.ts");
  });

  it("no site code reads quoteTake except through a simulate with an account", () => {
    const bad = SCANNED_DIRS.flatMap(sources).flatMap((file) =>
      badQuoteTakeReads(file, readFileSync(join(root, file), "utf8")));
    assert.deepEqual(bad, []);
  });
});
