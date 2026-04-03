export type SafeReplyType = "invalid_input" | "internal_error" | "unhandled_response";

export function safeReply(type: SafeReplyType | string) {
  switch (type) {
    case "invalid_input":
      return { message: "Invalid input provided." };

    case "internal_error":
      return { message: "Something went wrong. Try again." };

    default:
      return { message: "Unhandled response." };
  }
}
