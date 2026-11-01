import { CheckIcon, CloseIcon } from './Icons.jsx'
import './Toast.css'

function Toast({ message, onClose }) {
  if (!message) return null

  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="toast__icon" aria-hidden="true">
        <CheckIcon />
      </span>
      <p>{message}</p>
      <button
        type="button"
        className="toast__close"
        aria-label="Dismiss notification"
        onClick={onClose}
      >
        <CloseIcon />
      </button>
    </div>
  )
}

export default Toast
