import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ArteDocPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  nome: string;
}

export function ArteDocPreviewDialog({ open, onOpenChange, imageUrl, nome }: ArteDocPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{nome}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center">
          <img src={imageUrl} alt={nome} className="max-w-full max-h-[75vh] object-contain rounded" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
