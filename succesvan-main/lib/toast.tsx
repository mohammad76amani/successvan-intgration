import toast from "react-hot-toast";
import { FiCheck, FiAlertCircle } from "react-icons/fi";

const toastConfig = {
  success: {
    style: {
      background: "#0f172b",
      color: "#fe9a00",
      border: "1px solid #fe9a00",
      borderRadius: "12px",
      padding: "10px",

      
    },
    icon: <FiCheck className="text-[#fe9a00]" />,
  },
  error: {
    style: {
      background: "#0f172b",
      color: "#ef4444",
      border: "1px solid #ef4444",
      borderRadius: "12px",
      padding: "10px",
    },
    icon: <FiAlertCircle className="text-red-500" />,
  },
};

export const showToast = {
  success: (message: string) => toast.success(message, toastConfig.success),
  error: (message: string) => toast.error(message, toastConfig.error),
};
