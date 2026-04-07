import { createContext, useContext } from 'react';

/** True when the envelope editor is rendered from the team dashboard (documents/templates edit), not embed. */
const EnvelopeEditorNexisChromeContext = createContext(false);

export function useEnvelopeEditorNexisChrome() {
  return useContext(EnvelopeEditorNexisChromeContext);
}

export const EnvelopeEditorNexisChromeProvider = EnvelopeEditorNexisChromeContext.Provider;
