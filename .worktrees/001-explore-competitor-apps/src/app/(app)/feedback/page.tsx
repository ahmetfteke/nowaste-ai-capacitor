"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  Plus,
  ChevronUp,
  Trash2,
  Loader2,
  CheckCircle,
  MessageCircle,
  Send,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useSuggestions } from "@/hooks/use-suggestions";
import type { Suggestion, SuggestionComment } from "@/types";

export default function FeedbackPage() {
  const {
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
  } = useSuggestions();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showSubmitted, setShowSubmitted] = useState(false);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (!title.trim()) return;

    try {
      await addSuggestion(title.trim(), description.trim());
      setTitle("");
      setDescription("");
      setDialogOpen(false);
      setShowSubmitted(true);
      setTimeout(() => setShowSubmitted(false), 5000);
    } catch {
      // Error handling could be added here
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Loading suggestions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-4">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Feature Suggestions
            </h1>
            <p className="text-sm text-muted-foreground">
              Vote on ideas or suggest your own
            </p>
          </div>
          <Button size="icon" variant="default" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" />
          </Button>
          <Drawer open={dialogOpen} onOpenChange={setDialogOpen}>
            <DrawerContent>
              <DrawerHeader className="text-left">
                <DrawerTitle>New Suggestion</DrawerTitle>
              </DrawerHeader>
              <form onSubmit={handleSubmit} className="px-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Title
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Dark mode support"
                    maxLength={100}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your idea..."
                    maxLength={500}
                    rows={3}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </form>
              <DrawerFooter>
                <Button
                  className="w-full"
                  disabled={submitting || !title.trim()}
                  onClick={handleSubmit}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Suggestion"
                  )}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      {/* Submitted Message */}
      {showSubmitted && (
        <div className="px-5 pb-4">
          <div className="max-w-md mx-auto">
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Thanks for your suggestion!</p>
                  <p className="text-sm text-muted-foreground">
                    Your idea is under review and will appear here once approved.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Suggestions List */}
      <div className="px-5">
        <div className="max-w-md mx-auto space-y-3">
          {suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No Suggestions Yet
              </h2>
              <p className="text-muted-foreground max-w-sm">
                Be the first to suggest a feature! Tap the + button above.
              </p>
            </div>
          ) : (
            suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                hasVoted={hasVoted(suggestion)}
                isOwner={isOwner(suggestion)}
                onVote={() => vote(suggestion.id)}
                onDelete={() => removeSuggestion(suggestion.id)}
                onAddComment={(text) => addComment(suggestion.id, text)}
                onDeleteComment={(commentId) => removeComment(suggestion.id, commentId)}
                isCommentOwner={isCommentOwner}
                subscribeComments={subscribeComments}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SuggestionCard({
  suggestion,
  hasVoted,
  isOwner,
  onVote,
  onDelete,
  onAddComment,
  onDeleteComment,
  isCommentOwner,
  subscribeComments,
}: {
  suggestion: Suggestion;
  hasVoted: boolean;
  isOwner: boolean;
  onVote: () => void;
  onDelete: () => void;
  onAddComment: (text: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  isCommentOwner: (comment: SuggestionComment) => boolean;
  subscribeComments: (
    suggestionId: string,
    callback: (comments: SuggestionComment[]) => void
  ) => () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<SuggestionComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (!expanded) return;

    setLoadingComments(true);
    const unsubscribe = subscribeComments(suggestion.id, (items) => {
      setComments(items);
      setLoadingComments(false);
    });

    return () => unsubscribe();
  }, [expanded, suggestion.id, subscribeComments]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment("");
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const commentCount = suggestion.commentCount || 0;

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex gap-3">
          {/* Upvote Button */}
          <button
            onClick={onVote}
            className={`flex flex-col items-center justify-center w-12 h-16 rounded-lg transition-colors ${
              hasVoted
                ? "bg-primary/10 text-primary"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            <ChevronUp
              className={`w-5 h-5 ${hasVoted ? "fill-primary" : ""}`}
              strokeWidth={hasVoted ? 2.5 : 2}
            />
            <span className="text-sm font-semibold">{suggestion.upvotes}</span>
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground mb-1">
              {suggestion.title}
            </h3>
            {suggestion.description && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {suggestion.description}
              </p>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {suggestion.userInitials} · {formatDate(suggestion.createdAt)}
              </p>
              <div className="flex items-center gap-1">
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-muted-foreground hover:text-destructive"
                    onClick={onDelete}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comments Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>
            {commentCount} comment{commentCount !== 1 ? "s" : ""}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Comments Section */}
      {expanded && (
        <div className="border-t border-border bg-muted/30 p-4 space-y-3">
          {/* Comment Input */}
          <div className="flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              maxLength={300}
              className="flex-1 h-9 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
            />
            <Button
              size="sm"
              className="h-9 px-3"
              disabled={!newComment.trim() || submittingComment}
              onClick={handleSubmitComment}
            >
              {submittingComment ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Comments List */}
          {loadingComments ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              Loading comments...
            </p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div className="space-y-2">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex items-start gap-2 text-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-medium text-primary">
                      {comment.userInitials}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground">{comment.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(comment.createdAt)}
                    </p>
                  </div>
                  {isCommentOwner(comment) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => onDeleteComment(comment.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
