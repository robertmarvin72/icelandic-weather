import { useCallback, useEffect, useState } from "react";

export function useAdminBlogPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [publishingId, setPublishingId] = useState(null);
  const [error, setError] = useState("");

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin?action=listBlogPosts", {
        credentials: "include",
        cache: "no-store",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to load blog posts");
      }

      setPosts(Array.isArray(json.posts) ? json.posts : []);
    } catch (err) {
      setError(err?.message || "Failed to load blog posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const updatePost = useCallback(async (id, payload) => {
    setSavingId(id);
    setError("");

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "updateBlogPost",
          id,
          ...payload,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to update blog post");
      }

      setPosts((prev) => prev.map((post) => (post.id === id ? { ...post, ...json.post } : post)));

      return { ok: true, post: json.post };
    } catch (err) {
      setError(err?.message || "Failed to update blog post");
      return { ok: false, error: err?.message };
    } finally {
      setSavingId(null);
    }
  }, []);

  const publishPost = useCallback(async (id) => {
    setPublishingId(id);
    setError("");

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "publishBlogPost",
          id,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to publish blog post");
      }

      setPosts((prev) => prev.map((post) => (post.id === id ? { ...post, ...json.post } : post)));

      return { ok: true, post: json.post };
    } catch (err) {
      setError(err?.message || "Failed to publish blog post");
      return { ok: false, error: err?.message };
    } finally {
      setPublishingId(null);
    }
  }, []);

  return {
    posts,
    loading,
    savingId,
    publishingId,
    error,
    reloadPosts: loadPosts,
    updatePost,
    publishPost,
  };
}
