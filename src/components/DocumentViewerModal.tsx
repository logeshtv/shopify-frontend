import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  url: string | null;     // full URL or blob URL to a PDF
  title?: string;
  onClose: () => void;
}

/** Simple full‑screen viewer for a single PDF file */
const DocumentViewerModal: React.FC<Props> = ({ url, title, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  
  if (!url) return null;
  
  // Create a proxy URL through our backend
  const backend = import.meta.env.VITE_BACKEND_ENDPOINT;
  const proxyUrl = `${backend}/shopify/documents/view?documentUrl=${encodeURIComponent(url)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-lg shadow-lg flex flex-col">
        {/* header */}
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <h2 className="text-lg font-semibold truncate">{title || "Document"}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* PDF frame */}
        <iframe
          src={proxyUrl}
          title={title}
          className="flex-1 w-full"
          style={{ border: "none" }}
          onError={() => setError("Failed to load document")}
        />
        
        {error && (
          <div className="p-4 text-center bg-red-50 border-t border-red-200">
            <p className="text-red-600">{error}</p>
            <Button 
              className="mt-2" 
              size="sm"
              onClick={() => window.open(proxyUrl, '_blank')}
            >
              Try Download Instead
            </Button>
          </div>
        )}
      </div>
    </div>  
  );
};

export default DocumentViewerModal;
