// Monaco 0.52.2 embeds TypeScript 5.4.5, whose signature help can assert on
// spread arguments: https://github.com/microsoft/TypeScript/pull/58203.
// Keep this outside min/vs so syncing the upstream assets preserves it.
self.customTSWorkerFactory = (TypeScriptWorker) => class extends TypeScriptWorker {
  async getSignatureHelpItems(...args) {
    try {
      return await super.getSignatureHelpItems(...args);
    } catch (error) {
      if (
        typeof error?.message === 'string'
        && error.message.trim() === 'Debug Failure. Expected 1 < 1.'
      ) {
        // Skip only this hint; later requests still use the same language service.
        return undefined;
      }
      throw error;
    }
  }
};
