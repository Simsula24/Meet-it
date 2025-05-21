export interface GroupChat {
  id: string;
  event: string;
  created: string;
  updated: string;
  expand?: {
    event?: {
      id: string;
      title: string;
    };
  };
}

export interface ChatMessage {
  id: string;
  chat: string;
  sender: string;
  content: string;
  created: string;
  updated: string;
  expand?: {
    sender?: {
      id: string;
      name: string;
      avatar?: string;
    };
  };
}

export interface ChatParticipant {
  id: string;
  chat: string;
  user: string;
  joined_at: string;
  last_read: string;
  expand?: {
    user?: {
      id: string;
      name: string;
      avatar?: string;
    };
  };
} 