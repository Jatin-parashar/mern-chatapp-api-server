export const clearCallTimeouts = (call: any): void => {
  if (call.ringTimeout) clearTimeout(call.ringTimeout);
  if (call.durationTimeout) clearTimeout(call.durationTimeout);
};