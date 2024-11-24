import { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import { PRSuggestion } from "../constants";

export const INLINE_FIX_PROMPT = `
### Task Description
In this task, you are given a suggestion in XML format along with the content of the corresponding file. Your objective is to **precisely draft a code fix** based on the provided suggestion and instructions. This fix will be applied inline within the affected file. 

### Input Format
The input consists of:
1. An **XML suggestion**:
   \`\`\`xml
   <suggestion>
     <describe>A description of the problem or goal</describe>
     <type>The type of change (e.g., bug fix, performance improvement, etc.)</type>
     <comment>Detailed instructions for the required changes</comment>
     <code>The original code to be modified</code>
     <filename>The file where the changes need to be applied</filename>
   </suggestion>
   \`\`\`

2. The **content of the file** where the fix is to be applied. Each line in the file will be numbered for easy reference.

### Expected Output
Your response should contain only the following information in **JSON format**:
- **Comment**: A brief explanation of why the change is beneficial or how it addresses the issue.
- **Code**: The modified code snippet for the specified lines. This snippet must **only include the lines that are changed**. 
- **lineStart**: The starting line number of the modified section.
- **lineEnd**: The ending line number of the modified section.

### Instructions
1. Carefully read the \`comment\` field in the suggestion to understand what change is needed.
2. Refer to the line numbers provided in the file content to determine where changes should be applied.
3. Modify only the affected lines and return **only the modified portion**. The fix must:
   - Address the problem described in the \`comment\` field.
   - Be syntactically valid when inserted into the file.
   - Avoid including unrelated code or placeholders like "rest of the code...".
4. Ensure the fix aligns with the style and conventions of the original file.

### Examples of Valid Output
If a change is requested on lines 12-15 to rename a function for better clarity:
\`\`\`json
{
  "comment": "Renamed the function to better reflect its purpose.",
  "code": "def calculate_total_price(items):",
  "lineStart": 12,
  "lineEnd": 12
}
\`\`\`

If a bug fix involves adding a missing null check on lines 20-22:
\`\`\`json
{
  "comment": "Added a null check to prevent potential runtime errors.",
  "code": "if user is not None:\n    process_user(user)",
  "lineStart": 20,
  "lineEnd": 22
}
\`\`\`

Avoid providing unnecessary lines or incomplete changes. 

### Notes
- The modified snippet doesn't need to be independently executable but must integrate seamlessly into the original file.
- If the \`comment\` field requests multiple changes, ensure all relevant modifications are included in the response.

Based on these guidelines, process the input carefully and generate a precise, high-quality fix.
`;

export const INLINE_FIX_FUNCTION = {
  name: "fix",
  description: "The code fix to address the suggestion and rectify the issue.",
  parameters: {
    type: "object",
    properties: {
      comment: {
        type: "string",
        description: "Explanation of why this change improves the code.",
      },
      code: {
        type: "string",
        description: "The modified code snippet for the specified lines.",
      },
      lineStart: {
        type: "number",
        description: "Starting line number where changes are applied.",
      },
      lineEnd: {
        type: "number",
        description: "Ending line number where changes are applied.",
      },
    },
    required: ["comment", "code", "lineStart", "lineEnd"],
  },
};

const INLINE_USER_MESSAGE_TEMPLATE = `
### Suggestion
{SUGGESTION}

### File Content (With Line Numbers)
{FILE}
`;

const assignFullLineNumbers = (contents: string): string => {
  const lines = contents.split("\n");
  return lines
    .map((line, index) => `${index + 1}: ${line}`)
    .join("\n");
};

export const getInlineFixPrompt = (
  fileContents: string,
  suggestion: PRSuggestion
): ChatCompletionMessageParam[] => {
  const fileWithLineNumbers = assignFullLineNumbers(fileContents);
  const userMessage = INLINE_USER_MESSAGE_TEMPLATE.replace(
    "{SUGGESTION}",
    suggestion.toString()
  ).replace("{FILE}", fileWithLineNumbers);

  return [
    { role: "system", content: INLINE_FIX_PROMPT },
    { role: "user", content: userMessage },
  ];
};
