import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Show success message
export const showSuccess = (msg) =>
  toast.success(msg, { position: "top-right" });

// Show error message
export const showError = (msg) => toast.error(msg, { position: "top-right" });

// Show info message
export const showInfo = (msg) => toast.info(msg, { position: "top-right" });
