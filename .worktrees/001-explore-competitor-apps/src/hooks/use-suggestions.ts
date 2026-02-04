"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  subscribeSuggestions,
  createSuggestion,
  toggleUpvote,
  deleteSuggestion,
  subscribeComments,
  createComment,
  deleteComment,
} from "@/lib/firestore";
import type { Suggestion, SuggestionComment } from "@/types";

export function useSuggestions() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);

    // Subscribe to all suggestions (community-wide, not user-specific)
    const unsubscribe = subscribeSuggestions((items) => {
      setSuggestions(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addSuggestion = async (title: string, description: string) => {
    if (!user) throw new Error("Must be logged in");

    setSubmitting(true);
    try {
      await createSuggestion(user.uid, user.displayName || "", {
        title,
        description,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const vote = async (suggestionId: string) => {
    if (!user) throw new Error("Must be logged in");
    await toggleUpvote(suggestionId, user.uid);
  };

  const removeSuggestion = async (id: string) => {
    await deleteSuggestion(id);
  };

  const hasVoted = (suggestion: Suggestion): boolean => {
    return user ? suggestion.upvoters?.includes(user.uid) || false : false;
  };

  const isOwner = (suggestion: Suggestion): boolean => {
    return user ? suggestion.userId === user.uid : false;
  };

  const isCommentOwner = (comment: SuggestionComment): boolean => {
    return user ? comment.userId === user.uid : false;
  };

  const addComment = async (suggestionId: string, text: string) => {
    if (!user) throw new Error("Must be logged in");
    await createComment(suggestionId, user.uid, user.displayName || "", text);
  };

  const removeComment = async (suggestionId: string, commentId: string) => {
    await deleteComment(suggestionId, commentId);
  };

  return {
    suggestions,
    loading,
    submitting,
    addSuggestion,
    vote,
    removeSuggestion,
    hasVoted,
    isOwner,
    isCommentOwner,
    addComment,
    removeComment,
    subscribeComments,
  };
}
