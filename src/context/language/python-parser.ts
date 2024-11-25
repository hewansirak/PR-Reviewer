import { AbstractParser, EnclosingContext } from "../../constants";
import { parse } from "python-ast";

/**
 * Helper function to check if a node encloses a given range.
 */
const processNode = (
  node: any,
  lineStart: number,
  lineEnd: number,
  largestSize: number,
  largestEnclosingContext: any
) => {
  const { lineno: startLine, end_lineno: endLine } = node;
  if (startLine <= lineStart && lineEnd <= endLine) {
    const size = endLine - startLine;
    if (size > largestSize) {
      largestSize = size;
      largestEnclosingContext = node;
    }
  }
  return { largestSize, largestEnclosingContext };
};

/**
 * PythonParser class for parsing Python files and identifying enclosing contexts.
 */
export class PythonParser implements AbstractParser {
  /**
   * Finds the largest enclosing context for a specific line range in a Python file.
   * @param file The Python file content as a string.
   * @param lineStart Starting line number of the range.
   * @param lineEnd Ending line number of the range.
   * @returns The enclosing context node.
   */
  findEnclosingContext(
    file: string,
    lineStart: number,
    lineEnd: number
  ): EnclosingContext {
    const ast = parse(file);

    let largestEnclosingContext: any = null;
    let largestSize = 0;

    /**
     * Recursively traverse the AST.
     */
    const traverseNode = (node: any) => {
      if (!node) return;
      const { body } = node;

      // Process the current node.
      ({ largestSize, largestEnclosingContext } = processNode(
        node,
        lineStart,
        lineEnd,
        largestSize,
        largestEnclosingContext
      ));

      // If the node has children, recursively process them.
      if (Array.isArray(body)) {
        body.forEach((child: any) => traverseNode(child));
      }
    };

    traverseNode(ast);
    return {
      enclosingContext: largestEnclosingContext,
    } as EnclosingContext;
  }

  /**
   * Validates the Python file by attempting to parse it.
   * @param file The Python file content as a string.
   * @returns Whether the file is valid and any errors encountered.
   */
  dryRun(file: string): { valid: boolean; error: string } {
    try {
      parse(file);
      return {
        valid: true,
        error: "",
      };
    } catch (exc) {
      return {
        valid: false,
        error: exc.message,
      };
    }
  }
}
