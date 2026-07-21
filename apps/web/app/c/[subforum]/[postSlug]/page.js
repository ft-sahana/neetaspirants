import { apiFetch } from "@/lib/api";
import ThreadView from "@/components/ThreadView";

export default async function ThreadPage({ params }) {
  const { postSlug } = await params;
  const post = await apiFetch(`/posts/${postSlug}`);

  return <ThreadView initialPost={post} />;
}
