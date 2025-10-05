import { createContext, useContext, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { AudienceTone, ChatMessage, LabelResult, SessionStatus } from '../types';

interface SessionState {
  tone: AudienceTone;
  status: SessionStatus;
  labelResult: LabelResult | null;
  messages: ChatMessage[];
  capturedImage: string | null;
  error: string | null;
}

type SessionAction =
  | { type: 'SET_TONE'; tone: AudienceTone }
  | { type: 'SET_STATUS'; status: SessionStatus }
  | { type: 'SET_LABEL_RESULT'; result: LabelResult | null }
  | { type: 'SET_MESSAGES'; messages: ChatMessage[] }
  | { type: 'APPEND_MESSAGE'; message: ChatMessage }
  | { type: 'SET_IMAGE'; image: string | null }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'RESET' };

const initialState: SessionState = {
  tone: 'general',
  status: 'idle',
  labelResult: null,
  messages: [],
  capturedImage: null,
  error: null,
};

const sessionReducer = (state: SessionState, action: SessionAction): SessionState => {
  switch (action.type) {
    case 'SET_TONE':
      return { ...state, tone: action.tone };
    case 'SET_STATUS':
      return { ...state, status: action.status };
    case 'SET_LABEL_RESULT':
      return { ...state, labelResult: action.result };
    case 'SET_MESSAGES':
      return { ...state, messages: action.messages };
    case 'APPEND_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] };
    case 'SET_IMAGE':
      return { ...state, capturedImage: action.image };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'RESET':
      return { ...initialState, tone: state.tone };
    default:
      return state;
  }
};

interface SessionContextValue extends SessionState {
  setTone: (tone: AudienceTone) => void;
  setStatus: (status: SessionStatus) => void;
  setLabelResult: (result: LabelResult | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  appendMessage: (message: ChatMessage) => void;
  setCapturedImage: (image: string | null) => void;
  setError: (error: string | null) => void;
  resetSession: () => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  const value = useMemo<SessionContextValue>(() => ({
    ...state,
    setTone: (tone) => dispatch({ type: 'SET_TONE', tone }),
    setStatus: (status) => dispatch({ type: 'SET_STATUS', status }),
    setLabelResult: (result) => dispatch({ type: 'SET_LABEL_RESULT', result }),
    setMessages: (messages) => dispatch({ type: 'SET_MESSAGES', messages }),
    appendMessage: (message) => dispatch({ type: 'APPEND_MESSAGE', message }),
    setCapturedImage: (image) => dispatch({ type: 'SET_IMAGE', image }),
    setError: (error) => dispatch({ type: 'SET_ERROR', error }),
    resetSession: () => dispatch({ type: 'RESET' }),
  }), 
  [state]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSessionContext = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }

  return context;
};
