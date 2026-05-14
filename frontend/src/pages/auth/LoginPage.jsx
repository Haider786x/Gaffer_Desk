import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { loginUser } from "../../services/auth.js";
import { validateEmail } from "../../utils/validators.js";
import { AuthTerminalLayout } from "../../components/auth/AuthTerminalLayout.jsx";
import { AuthTerminalInput } from "../../components/auth/AuthTerminalInput.jsx";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid operator ID format";
    }

    if (!formData.password) {
      newErrors.password = "Encryption key required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await loginUser(formData);

      if (response.token && response.user) {
        login(response.user, response.token);
        navigate("/dashboard");
      }
    } catch (err) {
      showError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthTerminalLayout
      mode="login"
      instruction="Please authenticate to access the intelligence matrix."
      footerExtra={
        <p className="text-center text-[10px] uppercase tracking-[0.12em] text-[var(--gd-outline)] font-[family-name:var(--gd-font-mono)] mt-8 mb-2">
          <span className="text-[var(--gd-on-surface-variant)]">
            UNREGISTERED OPERATOR?{" "}
          </span>
          <Link
            to="/signup"
            className="text-[var(--gd-primary)] underline underline-offset-2 hover:opacity-90"
          >
            CREATE_NEW_OPERATOR
          </Link>
        </p>
      }
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5 flex-1 flex flex-col min-h-0 pb-1"
      >
        <AuthTerminalInput
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          label="OPERATOR_ID / EMAIL"
          glyph="id"
          placeholder="Enter terminal credentials..."
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
        />

        <AuthTerminalInput
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          label="ENCRYPTION_KEY"
          glyph="key"
          placeholder="............"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
        />

        <button
          type="submit"
          disabled={isLoading}
          className="gd-btn-access"
        >
          {isLoading ? "AUTHENTICATING..." : "ACCESS_TERMINAL →"}
        </button>
      </form>
    </AuthTerminalLayout>
  );
}
