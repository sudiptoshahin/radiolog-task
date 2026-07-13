"use client";

import { useState, useEffect, useRef } from "react";
import ApiService from "@/services/ApiService";
import { useRouter } from "next/navigation";

type FieldName = "username" | "email" | "password" | "password2";

interface FormState {
    username: string;
    email: string;
    password: string;
    password2: string;
}

type FormErrors = Partial<Record<FieldName, string>>;
type TouchedState = Partial<Record<FieldName, boolean>>;

interface ServerNotice {
    type: "error" | "success";
    text: string;
}

function validateField(name: FieldName, value: string, form: FormState): string {
    switch (name) {
        case "username": {
            const v = value.trim();
            if (!v) return "Username cannot be blank.";
            if (v.length < 3) return "Username needs at least 3 characters.";
            if (v.length > 100) return "Username is too long.";
            return "";
        }
        case "email": {
            const v = value.trim();
            if (!v) return "Email cannot be blank.";
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!re.test(v)) return "Enter a valid email address.";
            return "";
        }
        case "password": {
            if (!value) return "Password cannot be blank.";
            if (value.length < 8) return "Use at least 8 characters.";
            if (/^\d+$/.test(value)) return "Password can't be entirely numeric.";
            const uname = form.username.trim().toLowerCase();
            if (uname.length > 2 && value.toLowerCase().includes(uname)) {
                return "Password is too similar to your username.";
            }
            return "";
        }
        case "password2": {
            if (!value) return "Please confirm your password.";
            if (value !== form.password) return "Password fields didn't match.";
            return "";
        }
        default:
            return "";
    }
}

function validateAll(form: FormState): FormErrors {
    const errors: FormErrors = {};
    (Object.keys(form) as FieldName[]).forEach((key) => {
        const msg = validateField(key, form[key], form);
        if (msg) errors[key] = msg;
    });
    return errors;
}

interface FieldProps {
    label: string;
    name: FieldName;
    type?: string;
    value: string;
    error?: string;
    touched?: boolean;
    hint?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
}

function Field({ label, name, type = "text", value, error, touched, hint, onChange, onBlur }: FieldProps) {
    const showError = Boolean(touched && error);
    return (
        <div className="flex flex-col">
            <label htmlFor={name} className="mb-1.5 text-[13px] font-semibold tracking-wide text-stone-600">
                {label}
            </label>
            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                aria-invalid={showError}
                aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
                autoComplete={name === "password" || name === "password2" ? "new-password" : name}
                className={`border-0 border-b-[1.5px] bg-transparent px-0.5 py-2 font-sans text-[15px] text-stone-800
          outline-none transition-colors placeholder:text-stone-400
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-taupe focus-visible:outline-offset-2
          ${showError ? "border-b-red-700/70" : "border-b-cream-dark focus:border-b-sage"}`}
            />
            {showError ? (
                <p id={`${name}-error`} className="mt-1.5 text-[12.5px] text-red-700/80">
                    {error}
                </p>
            ) : hint ? (
                <p id={`${name}-hint`} className="mt-1.5 text-xs text-stone-400">
                    {hint}
                </p>
            ) : null}
        </div>
    );
}

export default function Register() {
    const [form, setForm] = useState<FormState>({ username: "", email: "", password: "", password2: "" });
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<TouchedState>({});
    const [submitting, setSubmitting] = useState(false);
    const [serverNotice, setServerNotice] = useState<ServerNotice | null>(null);
    const fontLoaded = useRef(false);
    const router = useRouter();

    useEffect(() => {
        if (fontLoaded.current) return;
        fontLoaded.current = true;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href =
            "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&display=swap";
        document.head.appendChild(link);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target as { name: FieldName; value: string };
        const next = { ...form, [name]: value };
        setForm(next);
        if (touched[name]) {
            setErrors((prev) => ({ ...prev, [name]: validateField(name, value, next) }));
        }
        if (name === "password" && touched.password2) {
            setErrors((prev) => ({ ...prev, password2: validateField("password2", next.password2, next) }));
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target as { name: FieldName; value: string };
        setTouched((prev) => ({ ...prev, [name]: true }));
        setErrors((prev) => ({ ...prev, [name]: validateField(name, value, form) }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setServerNotice(null);

        const allErrors = validateAll(form);
        setErrors(allErrors);
        setTouched({ username: true, email: true, password: true, password2: true });
        if (Object.keys(allErrors).length > 0) return;

        setSubmitting(true);
        const payload = {
            username: form.username.trim(),
            email: form.email.trim().toLowerCase(),
            password: form.password,
            password2: form.password2,
        };
        try {
            const res = await ApiService.REGISTER(payload);

            if (res.status === 201) {
                setServerNotice({ type: "success", text: "Account created. You can sign in now." });
                setForm({ username: "", email: "", password: "", password2: "" });
                setTouched({});
                setErrors({});
                router.push('/auth/login');
                return;
            }

            const data: Record<string, unknown> = await res.json().catch(() => ({}));
            const fieldErrors: FormErrors = {};
            let fallback = "";
            Object.entries(data).forEach(([key, val]) => {
                const msg = Array.isArray(val) ? String(val[0]) : String(val);
                if (key === "username" || key === "email" || key === "password" || key === "password2") {
                    fieldErrors[key] = msg;
                } else {
                    fallback = msg;
                }
            });
            if (Object.keys(fieldErrors).length) {
                setErrors((prev) => ({ ...prev, ...fieldErrors }));
                setTouched((prev) => ({
                    ...prev,
                    ...Object.fromEntries(Object.keys(fieldErrors).map((k) => [k, true])),
                }));
            }
            setServerNotice({
                type: "error",
                text: fallback || "Couldn't create your account. Check the fields above.",
            });
        } catch {
            setServerNotice({ type: "error", text: "Network error. Please try again." });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-cream via-cream-dark to-[#EDE7A8] px-5 py-12 font-sans">
            <svg
                className="pointer-events-none absolute -right-8 -top-10 h-56 w-56 opacity-90"
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d="M170 10 C150 40 140 80 150 130" stroke="#8A9A5B" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                <ellipse cx="152" cy="45" rx="16" ry="8" fill="#A3B378" transform="rotate(-30 152 45)" opacity="0.75" />
                <ellipse cx="140" cy="75" rx="14" ry="7" fill="#8A9A5B" transform="rotate(-50 140 75)" opacity="0.7" />
                <ellipse cx="146" cy="105" rx="15" ry="7.5" fill="#B38B6D" transform="rotate(-20 146 105)" opacity="0.55" />
                <ellipse cx="152" cy="132" rx="12" ry="6" fill="#A3B378" transform="rotate(-40 152 132)" opacity="0.6" />
            </svg>

            <svg
                className="pointer-events-none absolute -bottom-12 -left-10 h-48 w-48 rotate-[160deg] opacity-55"
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d="M170 10 C150 40 140 80 150 130" stroke="#B38B6D" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
                <ellipse cx="152" cy="45" rx="14" ry="7" fill="#C7A488" transform="rotate(-30 152 45)" opacity="0.6" />
                <ellipse cx="140" cy="75" rx="12" ry="6" fill="#B38B6D" transform="rotate(-50 140 75)" opacity="0.55" />
            </svg>

            <div className="relative z-10 w-full max-w-[420px] rounded-[4px] border-t-[3px] border-sage bg-white px-10 pb-9 pt-11 shadow-[0_1px_2px_rgba(111,125,72,0.08),0_18px_40px_-18px_rgba(111,125,72,0.35)] sm:px-10 max-sm:px-6">
                <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-taupe-dark">Create account</p>
                <h1 className="mb-2 font-serif text-[28px] font-medium leading-tight text-sage-dark" style={{ fontFamily: '"Fraunces", Georgia, serif' }}>
                    Join us
                </h1>
                <p className="mb-8 text-sm leading-relaxed text-stone-500">
                    A few details and you're in. It only takes a minute.
                </p>

                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                    <Field
                        label="Username"
                        name="username"
                        value={form.username}
                        error={errors.username}
                        touched={touched.username}
                        onChange={handleChange}
                        onBlur={handleBlur}
                    />
                    <Field
                        label="Email"
                        name="email"
                        type="email"
                        value={form.email}
                        error={errors.email}
                        touched={touched.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                    />
                    <Field
                        label="Password"
                        name="password"
                        type="password"
                        value={form.password}
                        error={errors.password}
                        touched={touched.password}
                        hint="At least 8 characters, not all numbers."
                        onChange={handleChange}
                        onBlur={handleBlur}
                    />
                    <Field
                        label="Confirm password"
                        name="password2"
                        type="password"
                        value={form.password2}
                        error={errors.password2}
                        touched={touched.password2}
                        onChange={handleChange}
                        onBlur={handleBlur}
                    />

                    <button
                        type="submit"
                        disabled={submitting}
                        className="mt-2 rounded-[3px] bg-sage-dark px-4 py-3 text-[14.5px] font-semibold tracking-wide text-cream
              transition-colors hover:not-disabled:bg-sage active:not-disabled:translate-y-px
              disabled:cursor-not-allowed disabled:bg-stone-300
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-taupe focus-visible:outline-offset-2
              motion-reduce:transition-none"
                    >
                        {submitting ? "Creating account…" : "Create account"}
                    </button>

                    <div className="mt-5 text-right">
                        <p className="text-[13px] text-stone-500">
                            Already have an account?{" "}
                            <a
                                href="/auth/login"
                                className="font-semibold text-taupe-dark underline decoration-taupe-light decoration-1 underline-offset-2 transition-colors hover:text-sage-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-taupe focus-visible:outline-offset-2">
                                Sign in
                            </a>
                        </p>
                    </div>

                    {serverNotice && (
                        <div
                            role="status"
                            className={`rounded-[3px] border px-3.5 py-2.5 text-[13.5px] leading-relaxed ${serverNotice.type === "success"
                                ? "border-[#D3DCB8] bg-[#EEF2E2] text-sage-dark"
                                : "border-[#EAC8BC] bg-[#FBEDE9] text-[#A24936]"
                                }`}
                        >
                            {serverNotice.text}
                        </div>
                    )}
                </form>
            </div >
        </div >
    );
}