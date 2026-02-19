export function generateInitialGreeting(name?: string) {
  return `
  Hi ${name || "there"}, this is Maya calling from Boreal Financial.
  I'm not calling to sell anything — I just wanted to confirm a few details
  and see if you'd like to schedule a quick funding review call with our team.
  `;
}
