import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  url: string | null;     // full URL or blob URL to a PDF
  title?: string;
  onClose: () => void;
}

/** Simple full‑screen viewer for a single PDF file */
const DocumentViewerModal: React.FC<Props> = ({ url, title, onClose }) => {
  if (!url) return null;

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
          src={url}
          title={title}
          className="flex-1 w-full"
          style={{ border: "none" }}
        />
      </div>
    </div>
  );
};

export default DocumentViewerModal;
