import { useMutation } from "@tanstack/react-query";
import { uploadDocument } from "@/lib/api";
import { useDocumentStore } from "@/stores/documentStore";
import { useChatStore } from "@/stores/chatStore";

/**
 * Hook for uploading a document and managing the upload lifecycle.
 */
export function useDocumentUpload() {
  const store = useDocumentStore();
  const clearChat = useChatStore((s) => s.clearMessages);

  const mutation = useMutation({
    mutationFn: uploadDocument,

    onMutate: () => {
      clearChat();
    },

    onSuccess: (data) => {
      store.setReady(data);
    },

    onError: (error: Error) => {
      store.setError(
        error.message || "Something went wrong during upload."
      );
    },
  });

  const upload = (file: File) => {
    store.setUploading(file.name);
    // Simulate state transitions for UX
    setTimeout(() => store.setExtracting(), 500);
    setTimeout(() => store.setAnalysing(), 1500);
    mutation.mutate(file);
  };

  return {
    upload,
    isLoading: mutation.isPending,
  };
}
