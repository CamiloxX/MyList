import { listRecentMessages } from "../queries";
import { ChatBubble } from "./chat-bubble";

/**
 * Server entry-point mounted in the authenticated app layout. Loads the recent
 * history once on the server, then hands off to the realtime client bubble.
 */
export async function ChatLauncher({
  viewerId,
  viewerIsAdmin,
}: {
  viewerId: string;
  viewerIsAdmin: boolean;
}) {
  const messages = await listRecentMessages();
  return (
    <ChatBubble initialMessages={messages} viewerId={viewerId} viewerIsAdmin={viewerIsAdmin} />
  );
}
