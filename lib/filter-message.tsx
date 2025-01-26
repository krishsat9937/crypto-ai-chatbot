interface ToolInvocation {
    state: string;
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    result: string;
  }
  
  interface Message {
    id: string;
    createdAt: string;
    role: string; // e.g. 'user' or 'assistant'
    content: string;
    toolInvocations?: ToolInvocation[];
    annotations?: { messageIdFromServer: string }[];
    revisionId?: string;
  }
  
  export function filterAssistantMessagesAfterToolInvocation(messages: Message[]): Message[] {
    let hasEncounteredToolInvocation = false;
    const filtered: Message[] = [];
  
    for (const msg of messages) {
      // Check if this message is a tool invocation message
      const isToolMessage = msg.toolInvocations && msg.toolInvocations.length > 0;
  
      if (isToolMessage) {
        // Once we hit a tool invocation, mark that we have encountered it
        hasEncounteredToolInvocation = true;
        // Keep this message as well since it's pre-invocation or at the point of invocation
        // (If you don't want to keep the tool invocation message itself, remove this push)
        filtered.push(msg);
      } else {
        // If we have not encountered a tool invocation yet, keep all messages
        // If we have encountered a tool invocation, only keep user messages
        if (!hasEncounteredToolInvocation || msg.role === 'user') {
          filtered.push(msg);
        }
        // If hasEncounteredToolInvocation = true and msg.role = 'assistant',
        // we skip pushing the assistant message, effectively filtering it out.
      }
    }
  
    return filtered;
  }
  