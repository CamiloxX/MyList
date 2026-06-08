import { getViewerChatContext, listRecentMessages } from "../queries";
import { ChatBubble } from "./chat-bubble";

/**
 * Server entry-point mounted in the authenticated app layout. Loads the recent
 * history and the viewer's chat context (name + moderation state) once on the
 * server, then hands off to the realtime client bubble.
 */
export async function ChatLauncher({
  viewerId,
  viewerIsAdmin,
}: {
  viewerId: string;
  viewerIsAdmin: boolean;
}) {
  const [messages, context] = await Promise.all([
    listRecentMessages(),
    getViewerChatContext(viewerId),
  ]);

  return (
    <ChatBubble
      initialMessages={messages}
      viewerId={viewerId}
      viewerName={context.displayName ?? ""}
      viewerIsAdmin={viewerIsAdmin}
      initialRestriction={context.restriction}
    />
  );
}
