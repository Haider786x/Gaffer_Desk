import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { registerUser } from "../../services/auth.js";
import {
  validateEmail,
  validateUsername,
  validatePassword,
} from "../../utils/validators.js";
import { AuthTerminalLayout } from "../../components/auth/AuthTerminalLayout.jsx";
import { AuthTerminalInput } from "../../components/auth/AuthTerminalInput.jsx";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (name === "password" && value) {
      const validationErrors = validatePassword(value);
      setPasswordErrors(validationErrors);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username) {
      newErrors.username = "Callsign required";
    } else if (!validateUsername(formData.username)) {
      newErrors.username = "3–30 chars: letters, digits, - or _";
    }

    if (!formData.email) {
      newErrors.email = "Operator email required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid operator ID format";
    }

    if (!formData.password) {
      newErrors.password = "Encryption key required";
    } else if (passwordErrors.length > 0) {
      newErrors.password = "Key does not meet policy";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Keys do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await registerUser(formData);

      if (response.token && response.user) {
        login(response.user, response.token);
        navigate("/dashboard");
      }
    } catch (err) {
      showError(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthTerminalLayout
      mode="signup"
      eyebrow="OPS_REGISTRATION_INITIATED"
      instruction="Provision a new operator profile for the intelligence workspace. All fields are audited."
      footerExtra={
        <p className="text-center text-[10px] uppercase tracking-[0.12em] text-[var(--gd-outline)] font-[family-name:var(--gd-font-mono)] mt-8 mb-2">
          <span className="text-[var(--gd-on-surface-variant)]">
            EXISTING_OPERATOR?{" "}
          </span>
          <Link
            to="/login"
            className="text-[var(--gd-primary)] underline underline-offset-2 hover:opacity-90"
          >
            RETURN_TO_ACCESS_GATE
          </Link>
        </p>
      }
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4 flex-1 flex flex-col min-h-0 pb-1"
      >
        <AuthTerminalInput
          id="reg-username"
          name="username"
          type="text"
          autoComplete="username"
          label="OPERATOR_CALLSIGN"
          glyph="user"
          placeholder="manager_alpha"
          value={formData.username}
          onChange={handleChange}
          error={errors.username}
        />

        <AuthTerminalInput
          id="reg-email"
          name="email"
          type="email"
          autoComplete="email"
          label="OPERATOR_ID / EMAIL"
          glyph="id"
          placeholder="you@unit.ops"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
        />

        <AuthTerminalInput
          id="reg-password"
          name="password"
          type="password"
          autoComplete="new-password"
          label="PRIMARY_ENCRYPTION_KEY"
          glyph="key"
          placeholder="............"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
        />

        {passwordErrors.length > 0 ? (
          <p className="font-[family-name:var(--gd-font-mono)] text-[10px] leading-relaxed text-[var(--gd-outline)] -mt-2">
            Policy: 8+ chars, upper, lower, number, special.
          </p>
        ) : null}

        <AuthTerminalInput
          id="reg-confirm"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          label="CONFIRM_ENCRYPTION_KEY"
          glyph="key"
          placeholder="............"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />

        <button
          type="submit"
          disabled={isLoading}
          className="gd-btn-access"
        >
          {isLoading ? "PROVISIONING..." : "COMMIT_OPERATOR_RECORD →"}
        </button>
      </form>
    </AuthTerminalLayout>
  );
}
