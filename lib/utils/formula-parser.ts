/**
 * Safe Formula Parser
 * Evaluates mathematical formulas without using eval()
 * Supports basic arithmetic and variable substitution
 */

type TokenType = 'NUMBER' | 'VARIABLE' | 'OPERATOR' | 'LPAREN' | 'RPAREN' | 'FUNCTION';

interface Token {
  type: TokenType;
  value: string | number;
}

// Supported functions
const FUNCTIONS: Record<string, (...args: number[]) => number> = {
  abs: Math.abs,
  ceil: Math.ceil,
  floor: Math.floor,
  round: Math.round,
  min: Math.min,
  max: Math.max,
  sqrt: Math.sqrt,
  pow: Math.pow,
};

// Operator precedence
const PRECEDENCE: Record<string, number> = {
  '+': 1,
  '-': 1,
  '*': 2,
  '/': 2,
  '%': 2,
};

/**
 * Tokenize a formula string
 */
function tokenize(formula: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < formula.length) {
    const char = formula[i];

    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Number (including decimals)
    if (/\d/.test(char) || (char === '.' && /\d/.test(formula[i + 1]))) {
      let numStr = '';
      while (i < formula.length && (/\d/.test(formula[i]) || formula[i] === '.')) {
        numStr += formula[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
      continue;
    }

    // Variable or function name (letters, underscores, digits after first char)
    if (/[a-zA-Z_]/.test(char)) {
      let name = '';
      while (i < formula.length && /[a-zA-Z0-9_]/.test(formula[i])) {
        name += formula[i];
        i++;
      }

      // Check if it's a known function
      if (FUNCTIONS[name.toLowerCase()]) {
        tokens.push({ type: 'FUNCTION', value: name.toLowerCase() });
      } else {
        tokens.push({ type: 'VARIABLE', value: name });
      }
      continue;
    }

    // Operators
    if (['+', '-', '*', '/', '%'].includes(char)) {
      tokens.push({ type: 'OPERATOR', value: char });
      i++;
      continue;
    }

    // Parentheses
    if (char === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }

    if (char === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }

    // Comma (for function arguments) - treat as special operator
    if (char === ',') {
      tokens.push({ type: 'OPERATOR', value: ',' });
      i++;
      continue;
    }

    // Unknown character - skip
    i++;
  }

  return tokens;
}

/**
 * Convert infix tokens to postfix (Reverse Polish Notation) using Shunting Yard algorithm
 */
function toPostfix(tokens: Token[]): Token[] {
  const output: Token[] = [];
  const operatorStack: Token[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case 'NUMBER':
      case 'VARIABLE':
        output.push(token);
        break;

      case 'FUNCTION':
        operatorStack.push(token);
        break;

      case 'OPERATOR':
        if (token.value === ',') {
          // Pop until left paren for function arguments
          while (
            operatorStack.length > 0 &&
            operatorStack[operatorStack.length - 1].type !== 'LPAREN'
          ) {
            output.push(operatorStack.pop()!);
          }
        } else {
          while (
            operatorStack.length > 0 &&
            operatorStack[operatorStack.length - 1].type === 'OPERATOR' &&
            PRECEDENCE[operatorStack[operatorStack.length - 1].value as string] >=
              PRECEDENCE[token.value as string]
          ) {
            output.push(operatorStack.pop()!);
          }
          operatorStack.push(token);
        }
        break;

      case 'LPAREN':
        operatorStack.push(token);
        break;

      case 'RPAREN':
        while (
          operatorStack.length > 0 &&
          operatorStack[operatorStack.length - 1].type !== 'LPAREN'
        ) {
          output.push(operatorStack.pop()!);
        }
        // Pop the left paren
        operatorStack.pop();
        // If there's a function on top, pop it too
        if (
          operatorStack.length > 0 &&
          operatorStack[operatorStack.length - 1].type === 'FUNCTION'
        ) {
          output.push(operatorStack.pop()!);
        }
        break;
    }
  }

  // Pop remaining operators
  while (operatorStack.length > 0) {
    output.push(operatorStack.pop()!);
  }

  return output;
}

/**
 * Evaluate postfix expression
 */
function evaluatePostfix(
  postfix: Token[],
  variables: Record<string, number>
): number {
  const stack: number[] = [];

  for (const token of postfix) {
    switch (token.type) {
      case 'NUMBER':
        stack.push(token.value as number);
        break;

      case 'VARIABLE': {
        const varName = token.value as string;
        // Case-insensitive variable lookup
        const varValue =
          variables[varName] ??
          variables[varName.toLowerCase()] ??
          variables[varName.toUpperCase()] ??
          0;
        stack.push(varValue);
        break;
      }

      case 'OPERATOR': {
        const b = stack.pop() ?? 0;
        const a = stack.pop() ?? 0;
        switch (token.value) {
          case '+':
            stack.push(a + b);
            break;
          case '-':
            stack.push(a - b);
            break;
          case '*':
            stack.push(a * b);
            break;
          case '/':
            stack.push(b !== 0 ? a / b : 0);
            break;
          case '%':
            stack.push(b !== 0 ? a % b : 0);
            break;
        }
        break;
      }

      case 'FUNCTION': {
        const funcName = token.value as string;
        const func = FUNCTIONS[funcName];
        if (func) {
          // For simplicity, assume functions take 1-2 args
          // More complex handling would require tracking arg count
          if (funcName === 'pow' || funcName === 'min' || funcName === 'max') {
            const arg2 = stack.pop() ?? 0;
            const arg1 = stack.pop() ?? 0;
            stack.push(func(arg1, arg2));
          } else {
            const arg = stack.pop() ?? 0;
            stack.push(func(arg));
          }
        }
        break;
      }
    }
  }

  return stack.pop() ?? 0;
}

/**
 * Parse and evaluate a formula with variable substitution
 *
 * @param formula - The formula string (e.g., "basePay * 0.10" or "round(grossPay / 12)")
 * @param variables - Object mapping variable names to their values
 * @returns The computed result, or 0 if evaluation fails
 *
 * @example
 * evaluateFormula("basePay * paymentDays / totalDays", { basePay: 25000, paymentDays: 20, totalDays: 22 })
 * // Returns: 22727.27...
 *
 * @example
 * evaluateFormula("round(grossPay * 0.05)", { grossPay: 30000 })
 * // Returns: 1500
 */
export function evaluateFormula(
  formula: string,
  variables: Record<string, number>
): number {
  try {
    if (!formula || typeof formula !== 'string') {
      return 0;
    }

    // Sanitize: only allow alphanumeric, operators, parentheses, dots, commas, underscores, spaces
    const sanitized = formula.replace(/[^a-zA-Z0-9+\-*/%().,_\s]/g, '');

    if (!sanitized.trim()) {
      return 0;
    }

    const tokens = tokenize(sanitized);
    const postfix = toPostfix(tokens);
    const result = evaluatePostfix(postfix, variables);

    // Round to avoid floating point issues
    return Math.round(result * 100) / 100;
  } catch (error) {
    console.error('Formula evaluation error:', error, { formula, variables });
    return 0;
  }
}

/**
 * Validate a formula string without evaluating it
 *
 * @param formula - The formula string to validate
 * @returns Object with isValid boolean and optional error message
 */
export function validateFormula(
  formula: string
): { isValid: boolean; error?: string } {
  try {
    if (!formula || typeof formula !== 'string') {
      return { isValid: false, error: 'Formula is empty or not a string' };
    }

    // Check for dangerous patterns
    const dangerousPatterns = [
      /eval\s*\(/i,
      /function\s*\(/i,
      /=>/,
      /new\s+/i,
      /import\s+/i,
      /require\s*\(/i,
      /process\./i,
      /global\./i,
      /window\./i,
      /document\./i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(formula)) {
        return { isValid: false, error: 'Formula contains disallowed patterns' };
      }
    }

    // Try tokenizing
    const tokens = tokenize(formula);

    if (tokens.length === 0) {
      return { isValid: false, error: 'Formula produced no valid tokens' };
    }

    // Check for balanced parentheses
    let parenCount = 0;
    for (const token of tokens) {
      if (token.type === 'LPAREN') parenCount++;
      if (token.type === 'RPAREN') parenCount--;
      if (parenCount < 0) {
        return { isValid: false, error: 'Unmatched closing parenthesis' };
      }
    }

    if (parenCount !== 0) {
      return { isValid: false, error: 'Unmatched opening parenthesis' };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
}

/**
 * Extract variable names from a formula
 *
 * @param formula - The formula string
 * @returns Array of unique variable names found in the formula
 */
export function extractVariables(formula: string): string[] {
  try {
    const tokens = tokenize(formula);
    const variables = tokens
      .filter((t) => t.type === 'VARIABLE')
      .map((t) => t.value as string);

    return [...new Set(variables)];
  } catch {
    return [];
  }
}

// Common payroll formula variables
export const PAYROLL_VARIABLES = {
  basePay: 'Base monthly pay',
  grossPay: 'Gross pay (all earnings)',
  basicSalary: 'Basic salary component',
  totalDays: 'Total working days in period',
  paymentDays: 'Actual days to be paid',
  presentDays: 'Days present',
  absentDays: 'Days absent',
  overtimeHours: 'Overtime hours worked',
  nightDiffHours: 'Night differential hours',
  holidayHours: 'Holiday hours worked',
  hourRate: 'Computed hourly rate',
  dailyRate: 'Computed daily rate',
} as const;
