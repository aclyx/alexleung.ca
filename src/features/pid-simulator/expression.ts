type EquationVariables = { y: number; v: number; u: number; t: number };
type Expression = (variables: EquationVariables) => number;

const functions = new Map<
  string,
  { arity: number; evaluate: (...values: number[]) => number }
>([
  ["sin", { arity: 1, evaluate: Math.sin }],
  ["cos", { arity: 1, evaluate: Math.cos }],
  ["abs", { arity: 1, evaluate: Math.abs }],
  ["sqrt", { arity: 1, evaluate: Math.sqrt }],
  ["exp", { arity: 1, evaluate: Math.exp }],
  ["log", { arity: 1, evaluate: Math.log }],
  ["min", { arity: 2, evaluate: Math.min }],
  ["max", { arity: 2, evaluate: Math.max }],
]);

// This deliberately small math grammar never evaluates JavaScript or accesses objects.
export function compileEquation(source: string): Expression {
  if (!source.trim()) throw new Error("Enter an equation.");
  if (source.length > 300)
    throw new Error("Keep the equation within 300 characters.");
  const tokens: string[] = [];
  const tokenPattern =
    /\s*(\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?|[a-zA-Z_]+|[+\-*/^(),])/y;
  let position = 0;
  while (position < source.trimEnd().length) {
    tokenPattern.lastIndex = position;
    const match = tokenPattern.exec(source);
    if (!match)
      throw new Error(
        `Unexpected character at position ${position + 1}. Use explicit multiplication, such as 2*y.`
      );
    tokens.push(match[1]);
    position = tokenPattern.lastIndex;
  }
  if (tokens.length > 128) throw new Error("The equation has too many terms.");
  let index = 0;
  let depth = 0;
  function consume(expected: string) {
    if (tokens[index] !== expected) throw new Error(`Expected '${expected}'.`);
    index += 1;
  }
  function primary(): Expression {
    const token = tokens[index++];
    if (!token)
      throw new Error("The equation ends before a value is complete.");
    if (token === "(") {
      const expression = nested();
      consume(")");
      return expression;
    }
    if (/^[\d.]/.test(token)) {
      const value = Number(token);
      if (!Number.isFinite(value)) throw new Error("Numbers must be finite.");
      return () => value;
    }
    if (token === "y" || token === "v" || token === "u" || token === "t") {
      return (variables) => variables[token];
    }
    if (token === "pi") return () => Math.PI;
    if (token === "e") return () => Math.E;
    const fn = functions.get(token);
    if (!fn)
      throw new Error(
        `Unknown term '${token}'. Use y, v, u, t, or a supported math function.`
      );
    consume("(");
    const args = [nested()];
    while (tokens[index] === ",") {
      index += 1;
      args.push(nested());
    }
    consume(")");
    if (args.length !== fn.arity)
      throw new Error(`${token} needs ${fn.arity} argument(s).`);
    return (variables) => fn.evaluate(...args.map((arg) => arg(variables)));
  }
  function power(): Expression {
    const left = primary();
    if (tokens[index] !== "^") return left;
    index += 1;
    const right = unary();
    return (variables) => left(variables) ** right(variables);
  }
  function unary(): Expression {
    if (++depth > 24) throw new Error("The equation is nested too deeply.");
    const sign = tokens[index];
    let expression: Expression;
    if (sign === "+" || sign === "-") {
      index += 1;
      const argument = unary();
      expression = (variables) => (sign === "-" ? -1 : 1) * argument(variables);
    } else expression = power();
    depth -= 1;
    return expression;
  }
  function multiply(): Expression {
    let expression = unary();
    while (tokens[index] === "*" || tokens[index] === "/") {
      const operator = tokens[index++];
      const left = expression;
      const right = unary();
      expression = (variables) =>
        operator === "*"
          ? left(variables) * right(variables)
          : left(variables) / right(variables);
    }
    return expression;
  }
  function add(): Expression {
    let expression = multiply();
    while (tokens[index] === "+" || tokens[index] === "-") {
      const operator = tokens[index++];
      const left = expression;
      const right = multiply();
      expression = (variables) =>
        operator === "+"
          ? left(variables) + right(variables)
          : left(variables) - right(variables);
    }
    return expression;
  }
  function nested(): Expression {
    if (++depth > 24) throw new Error("The equation is nested too deeply.");
    const expression = add();
    depth -= 1;
    return expression;
  }
  const expression = nested();
  if (index !== tokens.length)
    throw new Error(`Unexpected '${tokens[index]}'. Use * for multiplication.`);
  return expression;
}
