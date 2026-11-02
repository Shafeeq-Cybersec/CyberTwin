import Modal from "../ui/Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

/** Simple confirmation modal used for destructive actions like delete. */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onClose} widthClass="max-w-md">
      <p className="text-sm text-slate-300">{message}</p>
      <div className="flex justify-end gap-3 pt-5">
        <button onClick={onClose} className="px-4 py-2.5 text-sm rounded-lg text-slate-400 hover:bg-surface-700">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="bg-severity-critical/90 hover:bg-severity-critical text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
