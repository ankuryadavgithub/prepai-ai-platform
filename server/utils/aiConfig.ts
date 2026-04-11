let warnedAboutLegacyGroqKey = false;

export function getGroqApiKey() {
  if (process.env.GROQ_API_KEY) {
    return process.env.GROQ_API_KEY;
  }

  if (process.env.VITE_GROQ_API_KEY) {
    if (!warnedAboutLegacyGroqKey) {
      console.warn(
        "Using legacy VITE_GROQ_API_KEY on the server. Move this value to GROQ_API_KEY and remove the VITE_ prefix."
      );
      warnedAboutLegacyGroqKey = true;
    }
    return process.env.VITE_GROQ_API_KEY;
  }

  return "";
}
