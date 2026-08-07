export function UndoToast({ message, onUndo, onDismiss }: { message: string; onUndo: () => void; onDismiss: () => void }) {
  return <div className="undo-toast" role="status"><span>{message}</span><button onClick={onUndo}>Undo</button><button className="toast-dismiss" onClick={onDismiss} aria-label="Dismiss notification">×</button></div>
}
